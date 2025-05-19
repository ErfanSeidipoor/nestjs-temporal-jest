import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import {
  IHelloToUserWithTriggerWorkflowInput,
  sayHello_sayHello_signal,
  sayHelloToUserWithTrigger,
} from '../say-hello-to-user-with-trigger.workflow';

describe('SayHelloToUserWithTrigger Workflow', () => {
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
        '../say-hello-to-user-with-trigger.workflow',
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

  it('should call greeting when signal received within 10 minutes', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id';
    const testName = 'John';
    const input: IHelloToUserWithTriggerWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUserWithTrigger, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fast forward 5 minutes
    await testEnv.sleep('5 minutes');

    // Verify greeting hasn't been called yet
    expect(greetingMock).not.toHaveBeenCalled();

    // Send signal at 5 minute mark
    await handle.signal(sayHello_sayHello_signal);

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');

    // Verify greeting was called after signal
    expect(greetingMock).toHaveBeenCalledTimes(1);
    expect(greetingMock).toHaveBeenCalledWith(testName);
  });

  it('should not call greeting when signal not received within 10 minutes', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id-timeout';
    const testName = 'John';
    const input: IHelloToUserWithTriggerWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUserWithTrigger, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fast forward past the 10 minute timeout
    await testEnv.sleep('11 minutes');

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');

    // Verify greeting was never called
    expect(greetingMock).not.toHaveBeenCalled();
  });

  it('should call greeting immediately if signal received right away', async () => {
    const { client } = testEnv;

    // Test input
    const workflowId = 'test-workflow-id-immediate';
    const testName = 'John';
    const input: IHelloToUserWithTriggerWorkflowInput = {
      name: testName,
      workflowId,
    };

    const handle = await client.workflow.start(sayHelloToUserWithTrigger, {
      args: [input],
      taskQueue: 'test-queue',
      workflowId,
    });

    // Give the workflow a moment to set up handlers
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send signal immediately
    await handle.signal(sayHello_sayHello_signal);

    // Wait for workflow completion
    const result = await handle.result();
    expect(result).toBe('finished');

    // Verify greeting was called
    expect(greetingMock).toHaveBeenCalledTimes(1);
    expect(greetingMock).toHaveBeenCalledWith(testName);
  });
});
