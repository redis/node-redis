import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['MEMORY', 'PURGE']);
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

