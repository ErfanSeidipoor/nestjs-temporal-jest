import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import {
  getState_sayHelloToUserEveryOneMin_query,
  IHelloToUserEveryOneMinWorkflowInput,
  sayHelloToUserEveryOneMin,
} from '../say-hello-to-user-every-one-min.workflow';

describe('SayHelloToUserEveryOneMin Workflow', () => {
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
        '../say-hello-to-user-every-one-min.workflow',
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

  it('should execute workflow and continue as new', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id';
    const testName = 'John';
    const input: IHelloToUserEveryOneMinWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUserEveryOneMin, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test query before termination
    const state = await handle.query(getState_sayHelloToUserEveryOneMin_query);
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

    await testEnv.sleep(1 * 60 * 1000);
    expect(greetingMock).toHaveBeenCalledTimes(2);

    await testEnv.sleep(1 * 60 * 1000);
    expect(greetingMock).toHaveBeenCalledTimes(3);

    // Terminate the workflow since it runs indefinitely
    await handle.terminate();
  });
});
