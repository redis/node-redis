import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { AuthOptions } from './AUTH';

export interface MigrateOptions {
  COPY?: true;
  REPLACE?: true;
  AUTH?: AuthOptions;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    host: RedisArgument,
    port: number,
    key: RedisArgument | Array<RedisArgument>,
    destinationDb: number,
    timeout: number,
    options?: MigrateOptions
  ) {
    parser.pushVariadic(['MIGRATE', host, port.toString()]);
    const isKeyArray = Array.isArray(key);
  
    if (isKeyArray) {
      parser.push('');
    } else {
      parser.push(key);
    }
  
    parser.pushVariadic(
      [
        destinationDb.toString(),
        timeout.toString()
      ]
    );
  
    if (options?.COPY) {
      parser.push('COPY');
    }
  
    if (options?.REPLACE) {
      parser.push('REPLACE');
    }
  
    if (options?.AUTH) {
      if (options.AUTH.username) {
        parser.pushVariadic(
          [
            'AUTH2',
            options.AUTH.username,
            options.AUTH.password
          ]
        );
      } else {
        parser.pushVariadic(
          [
            'AUTH',
            options.AUTH.password
          ]
        );
      }
    }
  
    if (isKeyArray) {
      parser.pushVariadic(
        [
          'KEYS',
          ...key
        ]
      );
    }
  },
  transformArguments(
    host: RedisArgument,
    port: number,
    key: RedisArgument | Array<RedisArgument>,
    destinationDb: number,
    timeout: number,
    options?: MigrateOptions
  ) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
