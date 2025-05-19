import { Injectable } from '@nestjs/common';
import { Activities, Activity } from 'nestjs-temporal';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from '../db/entities/workflow.entity';

export type WorkflowStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TERMINATED'
  | 'TIMED_OUT'
  | 'CANCELED';

export interface WorkflowStatusChange {
  workflowId: string;
  status: WorkflowStatus;
  details?: any;
}

export interface WorkflowState {
  workflowId: string;
  [key: string]: any;
}

@Activities()
@Injectable()
export class LogActivity<S extends WorkflowState> implements ILogActivity<S> {
  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowRepository: Repository<WorkflowEntity>,
  ) {}

  @Activity()
  public async logStateChange(state: S): Promise<S> {
    const timestamp = new Date().toISOString();
    console.log(`<logStateChange> [${timestamp}] State changed:`, state);

    const workflowId = state.workflowId;
    let workflow = await this.workflowRepository.findOne({
      where: { workflowId },
    });

    if (workflow) {
      workflow.internalState = JSON.stringify(state);
      await workflow.save();
    } else {
      workflow = this.workflowRepository.create({
        workflowId,
        internalState: JSON.stringify(state),
      });
      await workflow.save();
    }

    return state;
  }

  @Activity()
  public async logWorkflowStatus(
    statusChange: WorkflowStatusChange,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(
      `<logWorkflowStatus> [${timestamp}] Workflow ${statusChange.workflowId} status changed to ${
        statusChange.status
      }`,
      statusChange.details || '',
    );

    let workflow = await this.workflowRepository.findOne({
      where: { workflowId: statusChange.workflowId },
    });

    if (workflow) {
      workflow.status = statusChange.status;
      await workflow.save();
    } else {
      workflow = this.workflowRepository.create({
        workflowId: statusChange.workflowId,
        status: statusChange.status,
      });
      await workflow.save();
    }
  }

  @Activity()
  public async logInfo(message: string, data?: any): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`<logInfo> [${timestamp}] INFO:`, message, data || '');
    return Promise.resolve();
  }

  @Activity()
  public async logError(error: string, data?: any): Promise<void> {
    const timestamp = new Date().toISOString();
    console.error(`<logError> [${timestamp}] ERROR:`, error, data || '');
    return Promise.resolve();
  }
}

export interface ILogActivity<S> {
  logStateChange(state: S): Promise<S>;
  logWorkflowStatus(statusChange: WorkflowStatusChange): Promise<void>;
  logInfo(message: string, data?: any): Promise<void>;
  logError(error: string, data?: any): Promise<void>;
}
