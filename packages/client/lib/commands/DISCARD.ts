import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('DISCARD');
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
