import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, values: Array<number>) {
    const args = ['TDIGEST.ADD', key];

    for (const value of values) {
      args.push(value.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
