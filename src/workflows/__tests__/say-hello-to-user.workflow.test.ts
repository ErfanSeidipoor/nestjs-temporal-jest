import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import {
  getState_sayHelloToUser_query,
  IHelloToUserWorkflowInput,
  sayHelloToUser,
} from '../say-hello-to-user.workflow';

describe('SayHelloToUser Workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  let worker: Worker;
  let runPromise: Promise<void>;
  let greetingMock: jest.Mock;
  let logStateChangeMock: jest.Mock;
  let logWorkflowStatusMock: jest.Mock;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  beforeEach(async () => {
    greetingMock = jest.fn().mockResolvedValue('Hello mock!');
    logStateChangeMock = jest.fn().mockResolvedValue(undefined);
    logWorkflowStatusMock = jest.fn().mockResolvedValue(undefined);

    // Set up Worker with mocked activities
    worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-queue',
      workflowsPath: require.resolve('../say-hello-to-user.workflow'),
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

  it('should execute workflow and update state correctly', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id';
    const testName = 'John';
    const input: IHelloToUserWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUser, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');

    // Test query
    const state = await handle.query(getState_sayHelloToUser_query);
    expect(state).toEqual({
      workflowId,
      name: testName,
    });

    // Verify activity calls
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
  });
});
