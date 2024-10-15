import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(alias: RedisArgument, index: RedisArgument) {
    return ['FT.ALIASADD', alias, index];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
