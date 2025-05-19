import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import {
  getState_sayHelloAndChangeName_query,
  IHelloToUserWithTriggerAndChangeNameWorkflowInput,
  sayHelloAndChangeName_sayHelloAndChangeName_signal,
  sayHelloToUserWithTriggerAndChangeName,
} from '../say-hello-to-user-with-trigger-and-change-name.workflow';

describe('SayHelloToUserWithTriggerAndChangeName Workflow', () => {
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
      workflowsPath: require.resolve(
        '../say-hello-to-user-with-trigger-and-change-name.workflow',
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

  it('should execute workflow after receiving signal with new name', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id';
    const initialName = 'John';
    const newName = 'Jane';
    const input: IHelloToUserWithTriggerAndChangeNameWorkflowInput = {
      name: initialName,
      workflowId,
    };

    const handle = await client.workflow.start(
      sayHelloToUserWithTriggerAndChangeName,
      {
        args: [input],
        taskQueue: 'test-queue',
        workflowId,
      },
    );

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test initial state before signal
    let state = await handle.query(getState_sayHelloAndChangeName_query);
    expect(state).toEqual({
      workflowId,
      name: initialName,
      shouldGreetUser: false,
    });

    // Send signal to trigger greeting with new name
    await handle.signal(
      sayHelloAndChangeName_sayHelloAndChangeName_signal,
      newName,
    );

    // Test state after signal
    state = await handle.query(getState_sayHelloAndChangeName_query);
    expect(state).toEqual({
      workflowId,
      name: newName,
      shouldGreetUser: true,
    });

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');

    // Verify activity calls
    expect(greetingMock).toHaveBeenCalledWith(newName);
    expect(logStateChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId,
        name: initialName,
        shouldGreetUser: false,
      }),
    );
    expect(logStateChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId,
        name: newName,
        shouldGreetUser: true,
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

  it('should wait indefinitely until signal is received', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id-wait';
    const initialName = 'John';
    const input: IHelloToUserWithTriggerAndChangeNameWorkflowInput = {
      name: initialName,
      workflowId,
    };

    const handle = await client.workflow.start(
      sayHelloToUserWithTriggerAndChangeName,
      {
        args: [input],
        taskQueue: 'test-queue',
        workflowId,
      },
    );

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Let it run for a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify no greeting was called
    expect(greetingMock).not.toHaveBeenCalled();

    // Terminate the workflow since it would wait indefinitely
    await handle.terminate();
  });
});
