import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(keys: Array<RedisArgument>) {
    return ['MGET', ...keys];
  },
  transformReply: undefined as unknown as () => Array<BlobStringReply | NullReply>
} as const satisfies Command;
