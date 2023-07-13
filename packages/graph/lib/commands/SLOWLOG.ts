import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

type SlowLogRawReply = ArrayReply<TuplesReply<[
  timestamp: BlobStringReply,
  command: BlobStringReply,
  query: BlobStringReply,
  took: BlobStringReply
]>>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['GRAPH.SLOWLOG', key];
  },
  transformReply(reply: UnwrapReply<SlowLogRawReply>) {
    return reply.map(log => {
      const [timestamp, command, query, took] = log as unknown as UnwrapReply<typeof log>;
      return {
        timestamp: Number(timestamp),
        command,
        query,
        took: Number(took)
      };
    });
  }
} as const satisfies Command;
