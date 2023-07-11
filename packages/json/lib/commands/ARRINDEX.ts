import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    start?: number,
    stop?: number
  ) {
    const args = ['JSON.ARRINDEX', key, path, transformRedisJsonArgument(json)];

    if (start !== undefined && start !== null) {
      args.push(start.toString());

      if (stop !== undefined && stop !== null) {
        args.push(stop.toString());
      }
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
