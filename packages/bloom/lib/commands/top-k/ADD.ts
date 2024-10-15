import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, items: RedisVariadicArgument) {
    return pushVariadicArguments(['TOPK.ADD', key], items);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
