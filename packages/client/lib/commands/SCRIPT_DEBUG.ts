import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCRIPT DEBUG command
   * 
   * @param parser - The command parser
   * @param mode - Debug mode: YES, SYNC, or NO
   * @see https://redis.io/commands/script-debug/
   */
  parseCommand(parser: CommandParser, mode: 'YES' | 'SYNC' | 'NO') {
    parser.push('SCRIPT', 'DEBUG', mode);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
