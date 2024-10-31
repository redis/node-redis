import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NullReply, BlobStringReply, Command, UnwrapReply } from '@redis/client/lib/RESP/types';
import { isArrayReply } from '@redis/client/lib/commands/generic-transformers';
import { transformRedisJsonNullReply } from '.';

export interface RedisArrPopOptions {
  path: RedisArgument;
  index?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: RedisArrPopOptions) {
    parser.push('JSON.ARRPOP');
    parser.pushKey(key);

    if (options) {
      parser.push(options.path);

      if (options.index !== undefined) {
        parser.push(options.index.toString());
      }
    }
  },
  transformReply(reply: NullReply | BlobStringReply | ArrayReply<NullReply | BlobStringReply>) {
    return isArrayReply(reply) ?
      (reply as unknown as UnwrapReply<typeof reply>).map(item => transformRedisJsonNullReply(item)) :
      transformRedisJsonNullReply(reply);
  }
} as const satisfies Command;

