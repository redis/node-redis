import { CommandParser } from '../client/parser';
import { VerbatimStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'INFO');
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
