import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkflowService } from './workflow.service';

@Controller()
export class AppController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('workflow/say-hello-to-user')
  runSayHelloToUserWorkflow(@Body('name') name: string) {
    console.log('name', name);
    return this.workflowService.runSayHelloToUserWorkflow(name);
  }

  @Put('workflow/:workflowId/terminate')
  terminateWorkflow(
    @Param('workflowId') workflowId: string,
    @Body('reason') reason: string,
  ) {
    return this.workflowService.terminateWorkflow(workflowId, reason);
  }

  @Put('workflow/:workflowId/cancel')
  cancelWorkflow(@Param('workflowId') workflowId: string) {
    return this.workflowService.cancelWorkflow(workflowId);
  }

  @Get('workflow')
  list(
    @Query()
    query: {
      type?: string;
      status?: 'Terminated' | 'Canceled' | 'Running';
      startDate?: Date;
    },
  ) {
    return this.workflowService.list(query);
  }

  @Post('workflow/say-hello-to-user-after-two-mins')
  runSayHelloToUserAfterTwoMinsWorkflow(@Body('name') name: string) {
    return this.workflowService.runSayHelloToUserAfterTwoMinsWorkflow(name);
  }

  @Post('workflow/say-hello-to-user-every-one-min')
  runSayHelloToUserEveryOneMinWorkflow(@Body('name') name: string) {
    return this.workflowService.runSayHelloToUserEveryOneMinWorkflow(name);
  }

  @Post('workflow/say-hello-to-user-with-trigger')
  runSayHelloToUserWithTriggerWorkflow(@Body('name') name: string) {
    return this.workflowService.runSayHelloToUserWithTriggerWorkflow(name);
  }

  @Post('workflow/:workflowId/signal')
  signalWorkflow(
    @Param('workflowId') workflowId: string,
    @Body('signal') signal: string,
  ) {
    return this.workflowService.signalWorkflow(workflowId, signal);
  }

  @Post('workflow/say-hello-to-user-with-trigger-and-change-name')
  runSayHelloToUserWithTriggerAndChangeNameWorkflow(
    @Body('name') name: string,
  ) {
    return this.workflowService.runSayHelloToUserWithTriggerAndChangeNameWorkflow(
      name,
    );
  }

  @Post('workflow/:workflowId/sayHelloAndChangeName')
  signalWorkflowAndChangeName(
    @Param('workflowId') workflowId: string,
    @Body('name') name: string,
  ) {
    return this.workflowService.signalWorkflow(
      workflowId,
      'sayHelloAndChangeName',
      [name],
    );
  }

  @Get('workflow/say-hello-to-user-with-trigger/:workflowId/getState')
  getStateOfSayHelloToUserWithTriggerWorkflow(
    @Param('workflowId') workflowId: string,
  ) {
    return this.workflowService.getState_sayHelloToUserWithTrigger(workflowId);
  }
}
