import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, iterator: number, chunk: RedisArgument) {
    return ['CF.LOADCHUNK', key, iterator.toString(), chunk];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
