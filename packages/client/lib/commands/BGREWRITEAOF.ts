import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Asynchronously rewrites the append-only file
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('BGREWRITEAOF');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
