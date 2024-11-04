import { RedisArgument, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GRAPH.DELETE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
