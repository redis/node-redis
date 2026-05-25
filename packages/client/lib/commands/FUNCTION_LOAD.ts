import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export interface FunctionLoadOptions {
  REPLACE?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, code: RedisArgument, options?: FunctionLoadOptions) {
    parser.push('FUNCTION', 'LOAD');

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }

    parser.push(code);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
