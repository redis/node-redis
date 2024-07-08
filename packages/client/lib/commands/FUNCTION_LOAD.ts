import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface FunctionLoadOptions {
  REPLACE?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, code: RedisArgument, options?: FunctionLoadOptions) {
    parser.pushVariadic(['FUNCTION', 'LOAD']);

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }

    parser.push(code);
  },
  transformArguments(code: RedisArgument, options?: FunctionLoadOptions) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
