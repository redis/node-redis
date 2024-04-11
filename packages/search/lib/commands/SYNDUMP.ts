import { RedisArgument, MapReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument) {
    return ['FT.SYNDUMP', index];
  },
  transformReply: {
    2: (reply: UnwrapReply<ArrayReply<BlobStringReply | ArrayReply<BlobStringReply>>>) => {
      const result: Record<string, ArrayReply<BlobStringReply>> = {};
      let i = 0;
      while (i < reply.length) {
        const key = (reply[i++] as unknown as UnwrapReply<BlobStringReply>).toString(),
          value = reply[i++] as unknown as ArrayReply<BlobStringReply>;
        result[key] = value;
      }
      return result;
    },
    3: undefined as unknown as () => MapReply<BlobStringReply, ArrayReply<BlobStringReply>>
  }
} as const satisfies Command;
