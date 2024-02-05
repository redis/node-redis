import { SimpleStringReply, Command, RedisArgument } from '../RESP/types';

export interface FunctionRestoreOptions {
  mode?: 'FLUSH' | 'APPEND' | 'REPLACE';
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(dump: RedisArgument, options?: FunctionRestoreOptions) {
    const args = ['FUNCTION', 'RESTORE', dump];

    if (options?.mode) {
      args.push(options.mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
