import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Removes the files of a sealed backup and returns to the `idle` state.
 */
export default {
  parseCommand(parser: CommandParser) {
    parser.push('BACKUP', 'CLEANUP');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
