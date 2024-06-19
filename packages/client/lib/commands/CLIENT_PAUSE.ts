import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, timeout: number, mode?: 'WRITE' | 'ALL') {
    parser.pushVariadic(['CLIENT', 'PAUSE', timeout.toString()]);
    if (mode) {
      parser.push(mode);
    }
  },
  transformArguments(timeout: number, mode?: 'WRITE' | 'ALL') { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
