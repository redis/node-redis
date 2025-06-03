import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export interface BgSaveOptions {
  SCHEDULE?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Asynchronously saves the dataset to disk
   * @param parser - The Redis command parser
   * @param options - Optional configuration
   * @param options.SCHEDULE - Schedule a BGSAVE operation when no BGSAVE is already in progress
   */
  parseCommand(parser: CommandParser, options?: BgSaveOptions) {
    parser.push('BGSAVE');
    if (options?.SCHEDULE) {
      parser.push('SCHEDULE');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
