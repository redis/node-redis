import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import NUMINCRBY from './NUMINCRBY';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, by: number) {
    return ['JSON.NUMMULTBY', key, path, by.toString()];
  },
  transformReply: NUMINCRBY.transformReply
} as const satisfies Command;
