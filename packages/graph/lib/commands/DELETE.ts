import { RedisArgument, BlobStringReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GRAPH.DELETE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
