import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, mode: 'YES' | 'SYNC' | 'NO') {
    parser.push('SCRIPT', 'DEBUG', mode);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
