import { CommandParser } from '@redis/client/lib/client/parser';
import { NullReply, BlobStringReply, ArrayReply, Command, RedisArgument, UnwrapReply } from '@redis/client/lib/RESP/types';

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
    // TODO: RESP3 wraps the response in another array, but only returns 1 
    3: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>>>) => {
      return reply[0];
    }
  },
} as const satisfies Command;
