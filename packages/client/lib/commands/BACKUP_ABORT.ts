import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Cancels a backup that has not been sealed yet.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'ABORT');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
