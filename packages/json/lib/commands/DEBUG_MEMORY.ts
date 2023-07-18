import { RedisArgument, NumberReply, ArrayReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path?: RedisArgument) {
    const args = ['JSON.DEBUG', 'MEMORY', key];

    if (path) {
      args.push(path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
