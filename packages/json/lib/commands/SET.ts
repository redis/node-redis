import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, NullReply, Command } from '@redis/client/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface JsonSetOptions {
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonSetOptions
  ) {
    parser.push('JSON.SET');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(json));

    if (options?.condition) {
      parser.push(options?.condition);
    } else if (options?.NX) {
      parser.push('NX');
    } else if (options?.XX) {
      parser.push('XX');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | NullReply
} as const satisfies Command;
