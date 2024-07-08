import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['CONFIG', 'RESETSTAT']);
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
