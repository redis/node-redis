import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, field: RedisArgument) {
    return ['HGET', key, field];
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
