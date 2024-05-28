import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(alias: RedisArgument, index: RedisArgument) {
    return ['FT.ALIASUPDATE', alias, index];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>,
  unstableResp3Module: true
} as const satisfies Command;
