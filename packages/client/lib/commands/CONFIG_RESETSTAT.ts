import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Resets the statistics reported by Redis using the INFO command
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CONFIG', 'RESETSTAT');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
