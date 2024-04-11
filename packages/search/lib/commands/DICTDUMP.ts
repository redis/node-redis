import { RedisArgument, ArrayReply, SetReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(dictionary: RedisArgument) {
    return ['FT.DICTDUMP', dictionary];
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
