import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CONFIG', 'RESETSTAT');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
