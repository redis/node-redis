import { RedisArgument, ArrayReply, NullReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import { pushVariadicArguments, RedisVariadicArgument, transformNullableDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    return pushVariadicArguments(['ZMSCORE', key], member);
  },
  transformReply: {
    2: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) => {
      return reply.map(transformNullableDoubleReply[2]);
    },
    3: undefined as unknown as () => ArrayReply<NullReply | DoubleReply>
  }
} as const satisfies Command;
