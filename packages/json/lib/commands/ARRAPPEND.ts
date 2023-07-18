import { RedisJSON, transformRedisJsonArgument } from '.';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, ...jsons: Array<RedisJSON>) {
    const args = ['JSON.ARRAPPEND', key, path];

    for (const json of jsons) {
      args.push(transformRedisJsonArgument(json));
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
