import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'ID');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
