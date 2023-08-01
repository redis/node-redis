import { RedisArgument, Command, NullReply, NumberReply, ArrayReply } from '@redis/client/dist/lib/RESP/types';

export interface JsonStrAppendOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, append: RedisArgument, options?: JsonStrAppendOptions) {
    const args = ['JSON.STRAPPEND', key];

    if (options?.path) {
      args.push(options.path);
    }

    args.push(append);
    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NullReply | NumberReply>
} as const satisfies Command;
