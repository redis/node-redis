import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Resumes processing of client commands after a CLIENT PAUSE
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'UNPAUSE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
