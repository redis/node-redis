import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCRIPT KILL command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/script-kill/
   */
  parseCommand(parser: CommandParser) {
    parser.push('SCRIPT', 'KILL');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
