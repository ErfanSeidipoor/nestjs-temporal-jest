import {
  defineQuery,
  proxyActivities,
  setHandler,
  sleep,
} from '@temporalio/workflow';
import { IUserActivity } from 'src/activities/user.activity';
import { ILogActivity } from 'src/activities/log.activity';
import { WorkflowLogger } from './workflow-logger.decorator';

export const sayHelloToUserAfterTwoMinsWorkflowType =
  'say-hello-to-user-after-two-mins';

/* ---------------------------------- input --------------------------------- */

export interface IHelloToUserAfterTwoMinsWorkflowInput {
  name: string;
  workflowId: string;
  state?: IHelloToUserAfterTwoMinsWorkflowState;
}

/* ---------------------------------- state --------------------------------- */

export interface IHelloToUserAfterTwoMinsWorkflowState {
  workflowId: string;
  name: string;
}

/* ------------------------------- activities ------------------------------- */

const { greeting } = proxyActivities<IUserActivity>({
  startToCloseTimeout: '1 minute',
});

const { logStateChange } = proxyActivities<
  ILogActivity<IHelloToUserAfterTwoMinsWorkflowState>
>({
  startToCloseTimeout: '1 minute',
});

/* --------------------------------- query --------------------------------- */

export const getState_sayHelloToUserAfterTwoMins_query =
  defineQuery<IHelloToUserAfterTwoMinsWorkflowState>(
    'getState_sayHelloToUserAfterTwoMins_query',
  );

/* -------------------------------------------------------------------------- */
/*                                  WORKFLOW                                    */
/* -------------------------------------------------------------------------- */

export class SayHelloToUserAfterTwoMinsWorkflow {
  @WorkflowLogger()
  static async sayHelloToUserAfterTwoMins(
    this: void,
    input: IHelloToUserAfterTwoMinsWorkflowInput,
  ): Promise<string> {
    const state: IHelloToUserAfterTwoMinsWorkflowState = input.state || {
      workflowId: input.workflowId,
      name: input.name,
    };

    await logStateChange(state);

    /* -------------------------------- handlers -------------------------------- */

    setHandler(getState_sayHelloToUserAfterTwoMins_query, () => state);

    /* --------------------------------- actions -------------------------------- */

    await sleep('2 minutes');
    await greeting(state.name);
    await logStateChange(state);

    return 'finished';
  }
}

export const sayHelloToUserAfterTwoMins =
  SayHelloToUserAfterTwoMinsWorkflow.sayHelloToUserAfterTwoMins;
