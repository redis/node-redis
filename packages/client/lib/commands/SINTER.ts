import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    keys: Array<RedisArgument> | RedisArgument
  ) {
    return pushVariadicArguments(['SINTER'], keys);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
