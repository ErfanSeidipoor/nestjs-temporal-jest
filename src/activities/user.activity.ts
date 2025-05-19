import { Injectable } from '@nestjs/common';
import { Activities, Activity } from 'nestjs-temporal';

@Activities()
@Injectable()
export class UserActivity implements IUserActivity {
  constructor() {}

  @Activity()
  public greeting(name: string): Promise<string> {
    console.log('greeting', name);
    return Promise.resolve('Hello ' + name);
  }
}

export interface IUserActivity {
  greeting(name: string): Promise<string>;
}
