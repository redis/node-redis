import { ArrayReply, BlobStringReply, SetReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument) {
    return pushVariadicArguments(['TS.QUERYINDEX'], filter);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
