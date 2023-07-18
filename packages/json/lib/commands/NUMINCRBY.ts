import { RedisArgument, NumberReply, DoubleReply, NullReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, by: number) {
    return ['JSON.NUMINCRBY', key, path, by.toString()];
  },
  transformReply: {
    2: (reply: UnwrapReply<BlobStringReply>) => {
      return JSON.parse(reply.toString()) as number | Array<number>;
    },
    3: undefined as unknown as () => NumberReply | DoubleReply | NullReply
  }
} as const satisfies Command;
