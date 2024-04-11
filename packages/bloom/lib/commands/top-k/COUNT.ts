import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, items: RedisVariadicArgument) {
    return pushVariadicArguments(['TOPK.COUNT', key], items);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
