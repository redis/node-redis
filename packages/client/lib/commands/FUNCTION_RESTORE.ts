import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';

export interface FunctionRestoreOptions {
  mode?: 'FLUSH' | 'APPEND' | 'REPLACE';
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, dump: RedisArgument, options?: FunctionRestoreOptions) {
    parser.push('FUNCTION', 'RESTORE', dump);

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
