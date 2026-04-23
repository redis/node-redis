import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export interface CopyCommandOptions {
  DB?: number;
  REPLACE?: boolean;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, options?: CopyCommandOptions) {
    parser.push('COPY');
    parser.pushKeys([source, destination]);

    if (options?.DB) {
      parser.push('DB', options.DB.toString());
    }

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
