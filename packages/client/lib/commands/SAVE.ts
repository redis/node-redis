import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SAVE command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/save/
   */
  parseCommand(parser: CommandParser) {
    parser.push('SAVE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
