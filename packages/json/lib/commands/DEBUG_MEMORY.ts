import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonDebugMemoryOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: JsonDebugMemoryOptions) {
    const args = ['JSON.DEBUG', 'MEMORY', key];

    if (options?.path !== undefined) {
      args.push(options.path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
