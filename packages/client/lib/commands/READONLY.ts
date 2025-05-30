import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the READONLY command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/readonly/
   */
  parseCommand(parser: CommandParser) {
    parser.push('READONLY');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
