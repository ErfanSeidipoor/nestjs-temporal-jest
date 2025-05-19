import { entities } from './entities';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { EnvironmentVariablesEnum } from '../environment-variables.enum';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get(EnvironmentVariablesEnum.POSTGRES_DB_HOST),
          username: config.get(EnvironmentVariablesEnum.POSTGRES_DB_USERNAME),
          password: config.get(EnvironmentVariablesEnum.POSTGRES_DB_PASSWORD),
          database: config.get(EnvironmentVariablesEnum.POSTGRES_DB_DATABASE),
          port: Number(config.get(EnvironmentVariablesEnum.POSTGRES_DB_PORT)),
          synchronize: true,
          logging: false,
          entities: entities as [],
        } as DataSourceOptions;
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [],
  exports: [TypeOrmModule.forFeature(entities)],
})
export class DBModule {}
