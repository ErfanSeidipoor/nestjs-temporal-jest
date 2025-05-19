import {
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import { IUserActivity } from 'src/activities/user.activity';
import { ILogActivity } from 'src/activities/log.activity';
import { WorkflowLogger } from './workflow-logger.decorator';

export const sayHelloToUserWithTriggerWorkflowType =
  'say-hello-to-user-with-trigger';
/* ---------------------------------- state --------------------------------- */

export interface IHelloToUserWithTriggerWorkflowState {
  workflowId: string;
  name: string;
  shouldGreetUser: boolean;
}

/* ---------------------------------- input --------------------------------- */

export interface IHelloToUserWithTriggerWorkflowInput {
  name: string;
  workflowId: string;
  state?: IHelloToUserWithTriggerWorkflowState;
}

/* ------------------------------- activities ------------------------------- */

const { greeting } = proxyActivities<IUserActivity>({
  startToCloseTimeout: '1 minute',
});

const { logStateChange } = proxyActivities<
  ILogActivity<IHelloToUserWithTriggerWorkflowState>
>({
  startToCloseTimeout: '1 minute',
});

/* --------------------------------- signal --------------------------------- */

export const sayHello_sayHello_signal = defineSignal(
  'sayHello_sayHello_signal',
);

/* --------------------------------- query --------------------------------- */

export const getState_sayHelloToUserWithTrigger_query =
  defineQuery<IHelloToUserWithTriggerWorkflowState>(
    'getState_sayHelloToUserWithTrigger_query',
  );

/* -------------------------------------------------------------------------- */
/*                                  WORKFLOW                                    */
/* -------------------------------------------------------------------------- */

export class SayHelloToUserWithTriggerWorkflow {
  @WorkflowLogger()
  static async sayHelloToUserWithTrigger(
    this: void,
    input: IHelloToUserWithTriggerWorkflowInput,
  ): Promise<string> {
    const state: IHelloToUserWithTriggerWorkflowState = input.state || {
      workflowId: input.workflowId,
      name: input.name,
      shouldGreetUser: false,
    };

    await logStateChange(state);

    /* -------------------------------- handlers -------------------------------- */

    setHandler(sayHello_sayHello_signal, async () => {
      state.shouldGreetUser = true;
      await logStateChange(state);
    });

    setHandler(getState_sayHelloToUserWithTrigger_query, () => state);

    /* --------------------------------- actions -------------------------------- */

    if (await condition(() => state.shouldGreetUser, '10 minutes')) {
      await greeting(state.name);
    }

    return 'finished';
  }
}

export const sayHelloToUserWithTrigger =
  SayHelloToUserWithTriggerWorkflow.sayHelloToUserWithTrigger;
