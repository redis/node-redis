import { RedisArgument, ArrayReply, NumberReply, NullReply, Command, } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path?: RedisArgument) {
    const args = ['JSON.TOGGLE', key]

    if (path) args.push(path);

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
