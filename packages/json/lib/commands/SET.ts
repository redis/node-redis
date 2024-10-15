import { RedisArgument, SimpleStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonSetOptions
  ) {
    const args = ['JSON.SET', key, path, transformRedisJsonArgument(json)];

    if (options?.condition) {
      args.push(options?.condition);
    } else if (options?.NX) {
      args.push('NX');
    } else if (options?.XX) {
      args.push('XX');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | NullReply
} as const satisfies Command;
