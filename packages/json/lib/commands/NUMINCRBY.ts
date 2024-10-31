import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, DoubleReply, NullReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMINCRBY');
    parser.pushKey(key);
    parser.push(path, by.toString());
  },
  transformReply: {
    2: (reply: UnwrapReply<BlobStringReply>) => {
      return JSON.parse(reply.toString()) as number | Array<null | number>;
    },
    3: undefined as unknown as () => ArrayReply<NumberReply | DoubleReply | NullReply>
  }
} as const satisfies Command;
