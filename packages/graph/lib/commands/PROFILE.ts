import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, query: RedisArgument) {
    parser.push('GRAPH.PROFILE');
    parser.pushKey(key);
    parser.push(query);
  },
  transformArguments(key: RedisArgument, query: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
