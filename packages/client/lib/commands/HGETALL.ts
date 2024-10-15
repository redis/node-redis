import { RedisArgument, MapReply, BlobStringReply, Command } from '../RESP/types';
import { transformTuplesReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['HGETALL', key];
  },
  TRANSFORM_LEGACY_REPLY: true,
  transformReply: {
    2: transformTuplesReply,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
