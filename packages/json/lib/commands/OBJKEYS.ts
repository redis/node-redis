import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '@redis/client/lib/RESP/types';

export interface JsonObjKeysOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonObjKeysOptions) {
    parser.push('JSON.OBJKEYS');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | ArrayReply<ArrayReply<BlobStringReply> | NullReply>
} as const satisfies Command;
