import { RedisArgument, ArrayReply, NullReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { createTransformNullableDoubleReplyResp2Func, pushVariadicArguments, RedisVariadicArgument } from './generic-transformers';

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
    2: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      return reply.map(createTransformNullableDoubleReplyResp2Func(preserve, typeMapping));
    },
    3: undefined as unknown as () => ArrayReply<NullReply | DoubleReply>
  }
} as const satisfies Command;
