import { RedisArgument, ArrayReply, NumberReply, DoubleReply, NullReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMINCRBY');
    parser.pushKey(key);
    parser.pushVariadic([path, by.toString()]);
  },
  transformArguments(key: RedisArgument, path: RedisArgument, by: number) { return [] },
  transformReply: {
    2: (reply: UnwrapReply<BlobStringReply>) => {
      return JSON.parse(reply.toString()) as number | Array<null | number>;
    },
    3: undefined as unknown as () => ArrayReply<NumberReply | DoubleReply | NullReply>
  }
} as const satisfies Command;
