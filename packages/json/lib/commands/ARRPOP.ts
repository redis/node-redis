import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NullReply, BlobStringReply, Command, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { isArrayReply, transformRedisJsonNullReply, JsonReviver } from '@redis/client/dist/lib/commands/generic-transformers';

export type RedisArrPopOptions = {
  reviver?: JsonReviver;
} & (
  | { path?: never; index?: never }
  | { path: RedisArgument; index?: number }
);

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, options?: RedisArrPopOptions) {
    parser.push('JSON.ARRPOP');
    parser.pushKey(key);

    if (options) {
      if (options.path !== undefined) {
        parser.push(options.path);

        if (options.index !== undefined) {
          parser.push(options.index.toString());
        }
      }

      parser.preserve = options.reviver;
    }
  },
  transformReply(reply: NullReply | BlobStringReply | ArrayReply<NullReply | BlobStringReply>, reviver?: JsonReviver) {
    return isArrayReply(reply) ?
      (reply as unknown as UnwrapReply<typeof reply>).map(item => transformRedisJsonNullReply(item, reviver)) :
      transformRedisJsonNullReply(reply, reviver);
  }
} as const satisfies Command;

