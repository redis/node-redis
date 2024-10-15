import { RedisArgument, ArrayReply, NullReply, BlobStringReply, Command, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { isArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformRedisJsonNullReply } from '.';

export interface RedisArrPopOptions {
  path: RedisArgument;
  index?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: RedisArrPopOptions) {
    const args = ['JSON.ARRPOP', key];

    if (options) {
      args.push(options.path);

      if (options.index !== undefined) {
        args.push(options.index.toString());
      }
    }
    
    return args;
  },
  transformReply(reply: NullReply | BlobStringReply | ArrayReply<NullReply | BlobStringReply>) {
    return isArrayReply(reply) ?
      (reply as unknown as UnwrapReply<typeof reply>).map(item => transformRedisJsonNullReply(item)) :
      transformRedisJsonNullReply(reply);
  }
} as const satisfies Command;

