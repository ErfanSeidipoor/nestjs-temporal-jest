import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowClient, WorkflowExecutionInfo } from '@temporalio/client';
import { QueryDefinition, uuid4 } from '@temporalio/workflow';
import { InjectTemporalClient } from 'nestjs-temporal';
import { EnvironmentVariablesEnum } from './environment-variables.enum';
import {
  sayHelloToUserAfterTwoMins,
  sayHelloToUserAfterTwoMinsWorkflowType,
} from './workflows/say-hello-to-user-after-two-mins.workflow';
import {
  IHelloToUserWithTriggerAndChangeNameWorkflowState,
  sayHelloToUserWithTriggerAndChangeName,
  sayHelloToUserWithTriggerAndChangeNameWorkflowType,
} from './workflows/say-hello-to-user-with-trigger-and-change-name.workflow';
import {
  getState_sayHelloToUserWithTrigger_query,
  sayHelloToUserWithTrigger,
  sayHelloToUserWithTriggerWorkflowType,
} from './workflows/say-hello-to-user-with-trigger.workflow';
import {
  sayHelloToUser,
  sayHelloToUserWorkflowType,
} from './workflows/say-hello-to-user.workflow';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowEntity } from './db/entities/workflow.entity';
import { sayHelloToUserEveryOneMin } from './workflows/say-hello-to-user-every-one-min.workflow';
import { sayHelloToUserEveryOneMinWorkflowType } from './workflows/say-hello-to-user-every-one-min.workflow';

@Injectable()
export class WorkflowService implements OnModuleDestroy {
  private statusPollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectTemporalClient() private readonly workflowClient: WorkflowClient,
    private readonly configService: ConfigService,
    @InjectRepository(WorkflowEntity)
    private readonly workflowRepository: Repository<WorkflowEntity>,
  ) {}

  async runSayHelloToUserWorkflow(user: string) {
    const workflowId = sayHelloToUserWorkflowType + uuid4();

    await this.workflowClient.start(sayHelloToUser, {
      args: [{ name: user, workflowId }],
      taskQueue: this.configService.get<string>(
        EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
      )!,
      workflowId,
    });

    const workflow = this.workflowRepository.create({
      workflowId,
      type: sayHelloToUserWorkflowType,
    });

    return await workflow.save();
  }

  async runSayHelloToUserAfterTwoMinsWorkflow(user: string) {
    const workflowId = sayHelloToUserAfterTwoMinsWorkflowType + uuid4();

    await this.workflowClient.start(sayHelloToUserAfterTwoMins, {
      args: [{ name: user, workflowId }],
      taskQueue: this.configService.get<string>(
        EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
      )!,
      workflowId,
    });

    const workflow = this.workflowRepository.create({
      workflowId,
      type: sayHelloToUserAfterTwoMinsWorkflowType,
    });

    return await workflow.save();
  }

  async runSayHelloToUserEveryOneMinWorkflow(user: string) {
    const workflowId = sayHelloToUserEveryOneMinWorkflowType + uuid4();

    await this.workflowClient.start(sayHelloToUserEveryOneMin, {
      args: [{ name: user, workflowId }],
      taskQueue: this.configService.get<string>(
        EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
      )!,
      workflowId,
    });

    const workflow = this.workflowRepository.create({
      workflowId,
      type: sayHelloToUserEveryOneMinWorkflowType,
    });

    return await workflow.save();
  }

  async runSayHelloToUserWithTriggerWorkflow(user: string) {
    const workflowId = sayHelloToUserWithTriggerWorkflowType + uuid4();

    await this.workflowClient.start(sayHelloToUserWithTrigger, {
      args: [{ name: user, workflowId }],
      taskQueue: this.configService.get<string>(
        EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
      )!,
      workflowId,
    });

    const workflow = this.workflowRepository.create({
      workflowId,
      type: sayHelloToUserWithTriggerWorkflowType,
    });

    return await workflow.save();
  }

  private async watchWorkflowStatus(workflowId: string) {
    let lastStatus = '';

    const checkStatus = async () => {
      try {
        const handle = this.workflowClient.getHandle(workflowId);
        const description = await handle.describe();
        const currentStatus = description.status.name;

        // Only log if status has changed
        if (currentStatus !== lastStatus) {
          console.log(
            `Workflow ${workflowId} status changed from ${lastStatus} to ${currentStatus}`,
          );

          // If workflow has reached a terminal state, stop polling
          if (
            [
              'COMPLETED',
              'FAILED',
              'CANCELED',
              'TERMINATED',
              'TIMED_OUT',
            ].includes(currentStatus)
          ) {
            this.stopWatchingWorkflow(workflowId);
          }

          lastStatus = currentStatus;
        }
      } catch (error) {
        console.error(`Error checking workflow status: ${error}`);
      }
    };

    // Check immediately
    await checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(() => void checkStatus(), 5000);
    this.statusPollingIntervals.set(workflowId, interval);
  }

  private stopWatchingWorkflow(workflowId: string) {
    const interval = this.statusPollingIntervals.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.statusPollingIntervals.delete(workflowId);
    }
  }

  async runSayHelloToUserWithTriggerAndChangeNameWorkflow(user: string) {
    const workflowId =
      sayHelloToUserWithTriggerAndChangeNameWorkflowType + uuid4();

    await this.workflowClient.start(sayHelloToUserWithTriggerAndChangeName, {
      args: [{ name: user, workflowId }],
      taskQueue: this.configService.get<string>(
        EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
      )!,
      workflowId,
    });

    const workflow = this.workflowRepository.create({
      workflowId,
      type: sayHelloToUserWithTriggerAndChangeNameWorkflowType,
    });

    return await workflow.save();
  }

  async getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    isTerminated: boolean;
  }> {
    try {
      const handle = this.workflowClient.getHandle(workflowId);
      const description = await handle.describe();

      const isTerminated = description.status.name === 'TERMINATED';

      return {
        status: description.status.name,
        isTerminated,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error getting workflow status: ${errorMessage}`);
      throw error;
    }
  }

  async terminateWorkflow(workflowId: string, reason: string): Promise<void> {
    try {
      const handle = this.workflowClient.getHandle(workflowId);
      await handle.terminate(reason);

      // Start watching the workflow status if not already watching
      if (!this.statusPollingIntervals.has(workflowId)) {
        void this.watchWorkflowStatus(workflowId);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error terminating workflow: ${errorMessage}`);
      throw error;
    }
  }

  async cancelWorkflow(id: string) {
    const workflowHandle = this.workflowClient.getHandle(id);
    await workflowHandle.cancel();
  }

  async list(query: {
    type?: string;
    status?: 'Terminated' | 'Canceled' | 'Running';
    startDate?: Date;
  }) {
    const { type, status, startDate } = query;
    const queryString: string[] = [];

    if (type) {
      queryString.push(`WorkflowType="${type}"`);
    }

    if (status) {
      queryString.push(`ExecutionStatus="${status}"`);
    }

    if (startDate) {
      queryString.push(`StartTime > "${new Date(startDate).toISOString()}"`);
    }

    // const query = `WorkflowType="${workflowType}" and ExecutionStatus="${state}" and StartTime > '${startDate.toISOString()}'`;
    const items: WorkflowExecutionInfo[] = [];

    console.log(queryString.join(' and '));

    for await (const workflowExecutionInfo of this.workflowClient.list({
      query: queryString.join(' and '),
    })) {
      items.push(workflowExecutionInfo);
    }

    return items;
  }

  async signalWorkflow(workflowId: string, signal: string, args?: string[]) {
    const workflowHandle = this.workflowClient.getHandle(workflowId);
    await workflowHandle.signal(signal, args);
  }

  async queryWorkflow(
    workflowId: string,
    query: QueryDefinition<IHelloToUserWithTriggerAndChangeNameWorkflowState>,
  ) {
    const workflowHandle = this.workflowClient.getHandle(workflowId);
    const result = await workflowHandle.query(query);
    return result;
  }

  async getState_sayHelloToUserWithTrigger(workflowId: string) {
    const workflowHandle = this.workflowClient.getHandle(workflowId);
    const result = await workflowHandle.query(
      getState_sayHelloToUserWithTrigger_query,
    );
    return result;
  }

  onModuleDestroy() {
    // Clear all intervals when the service is destroyed
    for (const interval of this.statusPollingIntervals.values()) {
      clearInterval(interval);
    }
    this.statusPollingIntervals.clear();
  }
}
