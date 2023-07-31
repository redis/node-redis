import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { pushVariadicArguments, RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(dictionary: RedisArgument, term: RedisVariadicArgument) {
    return pushVariadicArguments(['FT.DICTDEL', dictionary], term);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
