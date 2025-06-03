import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the READWRITE command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/readwrite/
   */
  parseCommand(parser: CommandParser) {
    parser.push('READWRITE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
