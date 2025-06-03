import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCRIPT FLUSH command
   * 
   * @param parser - The command parser
   * @param mode - Optional flush mode: ASYNC or SYNC
   * @see https://redis.io/commands/script-flush/
   */
  parseCommand(parser: CommandParser, mode?: 'ASYNC' | 'SYNC') {
    parser.push('SCRIPT', 'FLUSH');

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
