import { RedisArgument, NumberReply, Command } from '../RESP/types';

export interface CopyCommandOptions {
  DB?: number;
  REPLACE?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(source: RedisArgument, destination: RedisArgument, options?: CopyCommandOptions) {
    const args = ['COPY', source, destination];

    if (options?.DB) {
      args.push('DB', options.DB.toString());
    }

    if (options?.REPLACE) {
      args.push('REPLACE');
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
