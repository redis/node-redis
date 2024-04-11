import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface JsonMSetItem {
  key: RedisArgument;
  path: RedisArgument;
  value: RedisJSON;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(items: Array<JsonMSetItem>) {
    const args = new Array<RedisArgument>(1 + items.length * 3);
    args[0] = 'JSON.MSET';

    let argsIndex = 1;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      args[argsIndex++] = item.key;
      args[argsIndex++] = item.path;
      args[argsIndex++] = transformRedisJsonArgument(item.value);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
