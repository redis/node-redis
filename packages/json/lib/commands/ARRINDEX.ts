import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface JsonArrIndexOptions {
  range?: {
    start: number;
    stop?: number;
  };
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonArrIndexOptions
  ) {
    const args = ['JSON.ARRINDEX', key, path, transformRedisJsonArgument(json)];

    if (options?.range) {
      args.push(options.range.start.toString());

      if (options.range.stop !== undefined) {
        args.push(options.range.stop.toString());
      }
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
