import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Freezes the current backup, so that the files listed by BACKUP LIST are complete.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'SEAL');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
