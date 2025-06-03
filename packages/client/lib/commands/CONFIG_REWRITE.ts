import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Rewrites the Redis configuration file with the current configuration
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CONFIG', 'REWRITE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
