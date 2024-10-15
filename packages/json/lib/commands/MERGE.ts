import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, value: RedisJSON) {
    return [
      'JSON.MERGE',
      key,
      path,
      transformRedisJsonArgument(value)
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
