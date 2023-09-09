import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getData(_data:string): { message: string } {
    return { message: 'Hello API' };
  }

}
