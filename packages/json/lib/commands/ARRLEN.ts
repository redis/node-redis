import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonArrLenOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, options?: JsonArrLenOptions) {
    const args = ['JSON.ARRLEN', key];

    if (options?.path !== undefined) {
      args.push(options.path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
