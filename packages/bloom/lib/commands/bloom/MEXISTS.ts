import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, items: RedisVariadicArgument) {
    return pushVariadicArguments(['BF.MEXISTS', key], items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
