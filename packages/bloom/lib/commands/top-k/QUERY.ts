import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments, transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, items: RedisVariadicArgument) {
    return pushVariadicArguments(['TOPK.QUERY', key], items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
