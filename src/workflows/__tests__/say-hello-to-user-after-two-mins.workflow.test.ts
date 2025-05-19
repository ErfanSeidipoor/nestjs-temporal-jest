import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import {
  getState_sayHelloToUserAfterTwoMins_query,
  IHelloToUserAfterTwoMinsWorkflowInput,
  sayHelloToUserAfterTwoMins,
} from '../say-hello-to-user-after-two-mins.workflow';

describe('SayHelloToUserAfterTwoMins Workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;
  let runPromise: Promise<void>;
  let greetingMock: jest.Mock;
  let logStateChangeMock: jest.Mock;
  let logWorkflowStatusMock: jest.Mock;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  beforeEach(async () => {
    greetingMock = jest.fn().mockResolvedValue('Hello mock!');
    logStateChangeMock = jest.fn().mockResolvedValue(undefined);
    logWorkflowStatusMock = jest.fn().mockResolvedValue(undefined);

    // Set up Worker with mocked activities
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue',
      workflowsPath: require.resolve(
        '../say-hello-to-user-after-two-mins.workflow',
      ),
      activities: {
        greeting: greetingMock,
        logStateChange: logStateChangeMock,
        logWorkflowStatus: logWorkflowStatusMock,
      },
    });

    // Start the worker
    runPromise = worker.run();
  });

  afterEach(async () => {
    if (worker) {
      worker.shutdown();
      try {
        await runPromise;
      } catch (error) {
        console.error('Error shutting down worker:', error);
      }
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.teardown();
    }
  });

  it('should execute workflow and update state correctly after two minutes', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id';
    const testName = 'John';
    const input: IHelloToUserAfterTwoMinsWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUserAfterTwoMins, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test query
    const state = await handle.query(getState_sayHelloToUserAfterTwoMins_query);
    expect(state).toEqual({
      workflowId,
      name: testName,
    });

    // Verify activity calls
    expect(greetingMock).not.toHaveBeenCalledWith(testName);

    await testEnv.sleep(2 * 60 * 1000);

    expect(greetingMock).toHaveBeenCalledWith(testName);
    expect(logStateChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId,
        name: testName,
      }),
    );
    expect(logWorkflowStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId,
        status: 'RUNNING',
      }),
    );
    expect(logWorkflowStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId,
        status: 'COMPLETED',
      }),
    );

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');
  });
});
