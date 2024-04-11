import { RedisArgument, CommandArguments, BlobStringReply, Command } from '../RESP/types';

export interface FunctionLoadOptions {
  REPLACE?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(code: RedisArgument, options?: FunctionLoadOptions) {
    const args: CommandArguments = ['FUNCTION', 'LOAD'];

    if (options?.REPLACE) {
      args.push('REPLACE');
    }

    args.push(code);

    return args;
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
