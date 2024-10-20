import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

type SlowLogRawReply = ArrayReply<TuplesReply<[
  timestamp: BlobStringReply,
  command: BlobStringReply,
  query: BlobStringReply,
  took: BlobStringReply
]>>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GRAPH.SLOWLOG');
    parser.pushKey(key);
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
