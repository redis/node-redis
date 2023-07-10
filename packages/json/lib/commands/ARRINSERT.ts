import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, index: number, ...jsons: Array<RedisJSON>) {
    const args = ['JSON.ARRINSERT', key, path, index.toString()];

    for (const json of jsons) {
      args.push(transformRedisJsonArgument(json));
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
