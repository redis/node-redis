import { RedisArgument, Command, ArrayReply, NumberReply, DoubleReply, NullReply } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, by: number) {
    return ['JSON.NUMMULTBY', key, path, by.toString()];
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply | DoubleReply | NullReply>
} as const satisfies Command;
