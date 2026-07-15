import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('MEMORY', 'MALLOC-STATS');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;

