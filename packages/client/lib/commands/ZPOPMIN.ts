import { RedisArgument, TuplesReply, BlobStringReply, DoubleReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument) {
    return ['ZPOPMIN', key];
  },
  transformReply: {
    2: (reply: TuplesReply<[]> | TuplesReply<[BlobStringReply, BlobStringReply]>) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: Number(reply[1])
      };
    },
    3: (reply: TuplesReply<[]> | TuplesReply<[BlobStringReply, DoubleReply]>) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: reply[1]
      };
    }
  }
} as const satisfies Command;
