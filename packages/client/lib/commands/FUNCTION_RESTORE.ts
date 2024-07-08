import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface FunctionRestoreOptions {
  mode?: 'FLUSH' | 'APPEND' | 'REPLACE';
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, dump: RedisArgument, options?: FunctionRestoreOptions) {
    parser.pushVariadic(['FUNCTION', 'RESTORE', dump]);

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformArguments(dump: RedisArgument, options?: FunctionRestoreOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
