import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    fields: RedisVariadicArgument
  ) {
    return pushVariadicArguments(['HMGET', key], fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
