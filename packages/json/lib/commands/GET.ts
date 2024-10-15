import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformRedisJsonNullReply } from '.';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: JsonGetOptions) {
    let args = ['JSON.GET', key];

    if (options?.path !== undefined) {
      args = pushVariadicArguments(args, options.path);
    }

    return args;
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;
