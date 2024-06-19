import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, mode: 'YES' | 'SYNC' | 'NO') {
    parser.pushVariadic(['SCRIPT', 'DEBUG', mode]);
  },
  transformArguments(mode: 'YES' | 'SYNC' | 'NO') { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
