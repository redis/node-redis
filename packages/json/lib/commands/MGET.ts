import { RedisArgument, UnwrapReply, ArrayReply, NullReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonNullReply } from '.';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(keys: Array<RedisArgument>, path: RedisArgument) {
    return [
      'JSON.MGET',
      ...keys,
      path
    ];
  },
  transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) {
    return reply.map(json => transformRedisJsonNullReply(json))
  }
} as const satisfies Command;
