import { CommandParser } from '../client/parser';
import { VerbatimStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'NODES');
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
