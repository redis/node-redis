import { RedisArgument, TuplesReply, NumberReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, iterator: number) {
    return ['BF.SCANDUMP', key, iterator.toString()];
  },
  transformReply(reply: TuplesReply<[NumberReply, BlobStringReply]>) {
    return {
      iterator: reply[0],
      chunk: reply[1]
    };
  }
} as const satisfies Command;
