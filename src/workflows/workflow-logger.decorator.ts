import { ILogActivity } from '../activities/log.activity';
import { proxyActivities } from '@temporalio/workflow';
import { CancelledFailure, TimeoutFailure } from '@temporalio/workflow';

const { logWorkflowStatus } = proxyActivities<ILogActivity<unknown>>({
  startToCloseTimeout: '1 minute',
});

type WorkflowStatusType =
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELED'
  | 'TIMED_OUT'
  | 'FAILED';

type WorkflowFunction<I> = (args: I) => Promise<string>;

export function WorkflowLogger<I extends { workflowId: string }>() {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as WorkflowFunction<I>;

    const functionName = originalMethod.name || propertyKey;

    // Create a named wrapper function that preserves the original name
    const wrappedFunction: WorkflowFunction<I> = async function (
      this: unknown,
      args: I,
    ): Promise<string> {
      console.log('WorkflowLogger', {
        _target,
        propertyKey,
        descriptor,
        args,
      });
      const workflowId = args.workflowId;

      try {
        await logWorkflowStatus({
          workflowId,
          status: 'RUNNING' as WorkflowStatusType,
        });

        const result = (await originalMethod.apply(this, [args])) as string;

        await logWorkflowStatus({
          workflowId,
          status: 'COMPLETED' as WorkflowStatusType,
          details: { finalState: result },
        });

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        if (err instanceof CancelledFailure) {
          await logWorkflowStatus({
            workflowId,
            status: 'CANCELED' as WorkflowStatusType,
            details: { reason: message },
          });
        } else if (err instanceof TimeoutFailure) {
          await logWorkflowStatus({
            workflowId,
            status: 'TIMED_OUT' as WorkflowStatusType,
            details: { error: message },
          });
        } else {
          await logWorkflowStatus({
            workflowId,
            status: 'FAILED' as WorkflowStatusType,
            details: { error: message },
          });
        }
        throw err;
      }
    };

    Object.defineProperty(wrappedFunction, 'name', {
      value: functionName,
      configurable: true,
    });

    descriptor.value = wrappedFunction;
    return descriptor;
  };
}
