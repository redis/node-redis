import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonClearOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: JsonClearOptions) {
    const args = ['JSON.CLEAR', key];

    if (options?.path !== undefined) {
      args.push(options.path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
