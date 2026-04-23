import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, timeout: number, mode?: 'WRITE' | 'ALL') {
    parser.push('CLIENT', 'PAUSE', timeout.toString());
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
