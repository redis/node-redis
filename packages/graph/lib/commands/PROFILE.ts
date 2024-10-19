import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, query: RedisArgument) {
    parser.push('GRAPH.PROFILE');
    parser.pushKey(key);
    parser.push(query);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
