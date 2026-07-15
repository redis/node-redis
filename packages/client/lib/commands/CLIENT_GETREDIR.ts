import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'GETREDIR');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
