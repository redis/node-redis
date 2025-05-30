import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MEMORY MALLOC-STATS command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/memory-malloc-stats/
   */
  parseCommand(parser: CommandParser) {
    parser.push('MEMORY', 'MALLOC-STATS');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;

