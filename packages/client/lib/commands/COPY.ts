import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface CopyCommandOptions {
  DB?: number;
  REPLACE?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, options?: CopyCommandOptions) {
    parser.pushVariadic(['COPY', source, destination]);

    if (options?.DB) {
      parser.pushVariadic(['DB', options.DB.toString()]);
    }

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }
  },
  transformArguments(source: RedisArgument, destination: RedisArgument, options?: CopyCommandOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
