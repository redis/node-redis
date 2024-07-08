import { NullReply, BlobStringReply, ArrayReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonTypeOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonTypeOptions) {
    parser.push('JSON.TYPE');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonTypeOptions) { return [] },
  transformReply: {
    2: undefined as unknown as () => NullReply | BlobStringReply | ArrayReply<BlobStringReply>,
    // TODO: ?!??!
    3: undefined as unknown as () => any
  }
} as const satisfies Command;

