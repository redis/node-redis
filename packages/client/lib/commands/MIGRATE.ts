import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { AuthOptions } from './AUTH';

export interface MigrateOptions {
  COPY?: true;
  REPLACE?: true;
  AUTH?: AuthOptions;
}

export default {
  IS_READ_ONLY: false,
  transformArguments(
    host: RedisArgument,
    port: number,
    key: RedisArgument | Array<RedisArgument>,
    destinationDb: number,
    timeout: number,
    options?: MigrateOptions
  ) {
    const args = ['MIGRATE', host, port.toString()],
      isKeyArray = Array.isArray(key);
  
    if (isKeyArray) {
      args.push('');
    } else {
      args.push(key);
    }
  
    args.push(
      destinationDb.toString(),
      timeout.toString()
    );
  
    if (options?.COPY) {
      args.push('COPY');
    }
  
    if (options?.REPLACE) {
      args.push('REPLACE');
    }
  
    if (options?.AUTH) {
      if (options.AUTH.username) {
        args.push(
          'AUTH2',
          options.AUTH.username,
          options.AUTH.password
        );
      } else {
        args.push(
          'AUTH',
          options.AUTH.password
        );
      }
    }
  
    if (isKeyArray) {
      args.push(
        'KEYS',
        ...key
      );
    }
  
    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
