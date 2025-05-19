import {
  continueAsNew,
  defineQuery,
  proxyActivities,
  setHandler,
  sleep,
  workflowInfo,
} from '@temporalio/workflow';
import { IUserActivity } from 'src/activities/user.activity';
import { ILogActivity } from 'src/activities/log.activity';
import { WorkflowLogger } from './workflow-logger.decorator';

export const sayHelloToUserEveryOneMinWorkflowType =
  'say-hello-to-user-every-one-min';

/* ---------------------------------- state --------------------------------- */

export interface IHelloToUserEveryOneMinWorkflowState {
  workflowId: string;
  name: string;
}

/* ---------------------------------- input --------------------------------- */

export interface IHelloToUserEveryOneMinWorkflowInput {
  name: string;
  workflowId: string;
  state?: IHelloToUserEveryOneMinWorkflowState;
}

/* ------------------------------- activities ------------------------------- */

const { greeting } = proxyActivities<IUserActivity>({
  startToCloseTimeout: '1 minute',
});

const { logStateChange } = proxyActivities<
  ILogActivity<IHelloToUserEveryOneMinWorkflowState>
>({
  startToCloseTimeout: '1 minute',
});

/* --------------------------------- query --------------------------------- */

export const getState_sayHelloToUserEveryOneMin_query =
  defineQuery<IHelloToUserEveryOneMinWorkflowState>(
    'getState_sayHelloToUserEveryOneMin_query',
  );

/* -------------------------------------------------------------------------- */
/*                                  WORKFLOW                                    */
/* -------------------------------------------------------------------------- */

export class SayHelloToUserEveryOneMinWorkflow {
  @WorkflowLogger()
  static async sayHelloToUserEveryOneMin(
    this: void,
    input: IHelloToUserEveryOneMinWorkflowInput,
  ): Promise<string> {
    const state: IHelloToUserEveryOneMinWorkflowState = input.state || {
      workflowId: input.workflowId,
      name: input.name,
    };

    await logStateChange(state);

    /* -------------------------------- handlers -------------------------------- */

    setHandler(getState_sayHelloToUserEveryOneMin_query, () => state);

    /* --------------------------------- actions -------------------------------- */

    await greeting(state.name);

    while (!workflowInfo().continueAsNewSuggested) {
      await sleep('1 minute');
      await greeting(state.name);
    }

    await continueAsNew({
      ...input,
      state,
    });

    return 'finished';
  }
}

export const sayHelloToUserEveryOneMin =
  SayHelloToUserEveryOneMinWorkflow.sayHelloToUserEveryOneMin;
