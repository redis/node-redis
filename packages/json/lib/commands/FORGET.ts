import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonForgetOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: JsonForgetOptions) {
    const args = ['JSON.FORGET', key];

    if (options?.path !== undefined) {
      args.push(options.path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
