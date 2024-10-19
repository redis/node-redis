import { ArrayReply, BlobStringReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('GRAPH.LIST');
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
