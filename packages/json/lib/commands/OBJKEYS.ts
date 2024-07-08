import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonObjKeysOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonObjKeysOptions) {
    parser.push('JSON.OBJKEYS');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonObjKeysOptions) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | ArrayReply<ArrayReply<BlobStringReply> | NullReply>
} as const satisfies Command;
