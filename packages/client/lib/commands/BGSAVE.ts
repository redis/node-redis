import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface BgSaveOptions {
  SCHEDULE?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, options?: BgSaveOptions) {
    parser.push('BGSAVE');
    if (options?.SCHEDULE) {
      parser.push('SCHEDULE');
    }
  },
  transformArguments(options?: BgSaveOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
