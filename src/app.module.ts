import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection, WorkflowClient } from '@temporalio/client';
import {
  bundleWorkflowCode,
  NativeConnection,
  Runtime,
} from '@temporalio/worker';
import { TemporalModule } from 'nestjs-temporal';
import { join } from 'path';
import { LogActivity } from './activities/log.activity';
import { UserActivity } from './activities/user.activity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DBModule } from './db/db.module';
import { EnvironmentVariablesEnum } from './environment-variables.enum';
import { WorkflowService } from './workflow.service';

// Check Environments
for (const key of Object.keys(EnvironmentVariablesEnum)) {
  if (!process.env[key]) {
    throw new Error(key + ' must be Defined');
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TemporalModule.registerWorkerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        Runtime.install({});

        const connection = await NativeConnection.connect({
          address: configService.get<string>(
            EnvironmentVariablesEnum.TEMPORAL_ADDRESS,
          ),
        });

        const workflowBundle = await bundleWorkflowCode({
          workflowsPath: join(process.cwd(), 'src', 'workflows', 'index.ts'),
        });

        return {
          workerOptions: {
            connection,
            taskQueue: configService.get<string>(
              EnvironmentVariablesEnum.TEMPORAL_TASK_QUEUE,
            )!,
            workflowBundle,
          },
        };
      },
    }),
    TemporalModule.registerClientAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const temporalHost = configService.get<string>(
          EnvironmentVariablesEnum.TEMPORAL_ADDRESS,
        );

        const connection = await Connection.connect({
          address: temporalHost,
        });

        return {
          connection,
        };
      },
    }),
    DBModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WorkflowService,
    WorkflowClient,
    UserActivity,
    LogActivity,
  ],
})
export class AppModule {}
