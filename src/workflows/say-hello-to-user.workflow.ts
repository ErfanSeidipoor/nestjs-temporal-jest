import { defineQuery, proxyActivities, setHandler } from '@temporalio/workflow';
import { IUserActivity } from 'src/activities/user.activity';
import { ILogActivity } from 'src/activities/log.activity';
import { WorkflowLogger } from './workflow-logger.decorator';

export const sayHelloToUserWorkflowType = 'say-hello-to-user';

/* ---------------------------------- state --------------------------------- */

export interface IHelloToUserWorkflowState {
  workflowId: string;
  name: string;
}

/* ---------------------------------- input --------------------------------- */

export interface IHelloToUserWorkflowInput {
  name: string;
  workflowId: string;
  state?: IHelloToUserWorkflowState;
}

/* ------------------------------- activities ------------------------------- */
const { greeting } = proxyActivities<IUserActivity>({
  startToCloseTimeout: '1 minute',
});

const { logStateChange } = proxyActivities<
  ILogActivity<IHelloToUserWorkflowState>
>({
  startToCloseTimeout: '1 minute',
});

/* --------------------------------- query --------------------------------- */

export const getState_sayHelloToUser_query =
  defineQuery<IHelloToUserWorkflowState>('getState_sayHelloToUser_query');

/* -------------------------------------------------------------------------- */
/*                                  WORKFLOW                                    */
/* -------------------------------------------------------------------------- */

export class SayHelloToUserWorkflow {
  @WorkflowLogger()
  static async sayHelloToUser(
    this: void,
    input: IHelloToUserWorkflowInput,
  ): Promise<string> {
    const state: IHelloToUserWorkflowState = input.state || {
      workflowId: input.workflowId,
      name: input.name,
    };

    await logStateChange(state);

    /* -------------------------------- handlers -------------------------------- */

    setHandler(getState_sayHelloToUser_query, () => state);

    /* --------------------------------- actions -------------------------------- */

    await greeting(state.name);
    await logStateChange(state);

    return 'finished';
  }
}

export const sayHelloToUser = SayHelloToUserWorkflow.sayHelloToUser;
