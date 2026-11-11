import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Starts a new backup into the directory set by the `backupdirname` configuration.
 * The backup directory must be empty, and only one backup can be in progress at a time.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'START');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
