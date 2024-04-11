import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    path: RedisArgument,
    index: number,
    json: RedisJSON,
    ...jsons: Array<RedisJSON>
  ) {
    const args = new Array<RedisArgument>(4 + jsons.length);
    args[0] = 'JSON.ARRINSERT';
    args[1] = key;
    args[2] = path;
    args[3] = index.toString();
    args[4] = transformRedisJsonArgument(json);

    let argsIndex = 5;
    for (let i = 0; i < jsons.length; i++) {
      args[argsIndex++] = transformRedisJsonArgument(jsons[i]);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
