import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(keys: RedisVariadicArgument) {
    return pushVariadicArguments(['SUNION'], keys);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
