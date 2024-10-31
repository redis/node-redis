import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export interface BgSaveOptions {
  SCHEDULE?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, options?: BgSaveOptions) {
    parser.push('BGSAVE');
    if (options?.SCHEDULE) {
      parser.push('SCHEDULE');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
