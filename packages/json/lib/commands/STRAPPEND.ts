import { RedisArgument, Command, NullReply, NumberReply, ArrayReply } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonArgument } from '.';

export interface JsonStrAppendOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, append: string, options?: JsonStrAppendOptions) {
    const args = ['JSON.STRAPPEND', key];

    if (options?.path !== undefined) {
      args.push(options.path);
    }

    args.push(transformRedisJsonArgument(append));
    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NullReply | NumberReply>
} as const satisfies Command;
