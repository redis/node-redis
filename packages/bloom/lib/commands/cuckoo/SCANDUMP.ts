import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, TuplesReply, NumberReply, BlobStringReply, NullReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, iterator: number) {
    parser.push('CF.SCANDUMP');
    parser.pushKey(key);
    parser.push(iterator.toString());
  },
  transformReply(reply: UnwrapReply<TuplesReply<[NumberReply, BlobStringReply | NullReply]>>) {
    return {
      iterator: reply[0],
      chunk: reply[1]
    };
  }
} as const satisfies Command;
