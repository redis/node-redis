import { RedisArgument, TuplesReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMAX');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: {
    2: (reply: UnwrapReply<TuplesReply<[] | [BlobStringReply, BlobStringReply]>>) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: Number(reply[1])
      };
    },
    3: (reply: UnwrapReply<TuplesReply<[] | [BlobStringReply, DoubleReply]>>) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: reply[1]
      };
    }
  }
} as const satisfies Command;
