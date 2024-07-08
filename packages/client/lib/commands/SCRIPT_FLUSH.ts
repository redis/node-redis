import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, mode?: 'ASYNC' | 'SYNC') {
    parser.pushVariadic(['SCRIPT', 'FLUSH']);

    if (mode) {
      parser.push(mode);
    }
  },
  transformArguments(mode?: 'ASYNC' | 'SYNC') { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
