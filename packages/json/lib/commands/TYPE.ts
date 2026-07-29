import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { NullReply, BlobStringReply, ArrayReply, Command, RedisArgument, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export interface JsonTypeOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonTypeOptions) {
    parser.push('JSON.TYPE');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformReply: {
    2: undefined as unknown as () => NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>,
    /**
     * Unwraps the top-level array wrapper returned by RedisJSON under RESP3 protocol
     */
    3: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>>>) => {
      return Array.isArray(reply) ? reply[0] : reply;
    }
  },
} as const satisfies Command;
