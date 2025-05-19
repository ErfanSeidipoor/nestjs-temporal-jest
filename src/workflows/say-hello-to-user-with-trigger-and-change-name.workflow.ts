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

export const sayHelloToUserWithTriggerAndChangeNameWorkflowType =
  'say-hello-to-user-with-trigger-and-change-name';
/* ---------------------------------- state --------------------------------- */

export interface IHelloToUserWithTriggerAndChangeNameWorkflowState {
  workflowId: string;
  name: string;
  shouldGreetUser: boolean;
}

/* ---------------------------------- input --------------------------------- */

export interface IHelloToUserWithTriggerAndChangeNameWorkflowInput {
  name: string;
  workflowId: string;
  state?: IHelloToUserWithTriggerAndChangeNameWorkflowState;
}

/* ------------------------------- activities ------------------------------- */
const { greeting } = proxyActivities<IUserActivity>({
  startToCloseTimeout: '1 minute',
});

const { logStateChange } = proxyActivities<
  ILogActivity<IHelloToUserWithTriggerAndChangeNameWorkflowState>
>({
  startToCloseTimeout: '1 minute',
});

/* --------------------------------- signal --------------------------------- */

export const sayHelloAndChangeName_sayHelloAndChangeName_signal = defineSignal<
  [string]
>('sayHelloAndChangeName_sayHelloAndChangeName_signal');

/* --------------------------------- query --------------------------------- */

export const getState_sayHelloAndChangeName_query =
  defineQuery<IHelloToUserWithTriggerAndChangeNameWorkflowState>(
    'getState_sayHelloAndChangeName_query',
  );

/* -------------------------------------------------------------------------- */
/*                                  WORKFLOW                                    */
/* -------------------------------------------------------------------------- */

export class SayHelloToUserWithTriggerAndChangeNameWorkflow {
  @WorkflowLogger()
  static async sayHelloToUserWithTriggerAndChangeName(
    this: void,
    input: IHelloToUserWithTriggerAndChangeNameWorkflowInput,
  ): Promise<string> {
    const state: IHelloToUserWithTriggerAndChangeNameWorkflowState =
      input.state || {
        workflowId: input.workflowId,
        name: input.name,
        shouldGreetUser: false,
      };
    await logStateChange(state);

    /* -------------------------------- handlers -------------------------------- */

    setHandler(
      sayHelloAndChangeName_sayHelloAndChangeName_signal,
      async (name) => {
        state.shouldGreetUser = true;
        state.name = name;
        await logStateChange(state);
      },
    );

    setHandler(getState_sayHelloAndChangeName_query, () => state);

    /* --------------------------------- actions -------------------------------- */

    await condition(() => state.shouldGreetUser);
    await greeting(state.name);
    await logStateChange(state);

    return 'finished';
  }
}

export const sayHelloToUserWithTriggerAndChangeName =
  SayHelloToUserWithTriggerAndChangeNameWorkflow.sayHelloToUserWithTriggerAndChangeName;
