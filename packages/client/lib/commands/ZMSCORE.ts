import { RedisArgument, ArrayReply, NullReply, BlobStringReply, DoubleReply, Command } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    return pushVariadicArgument(['ZMSCORE', key], member);
  },
  transformReply: {
    2: (reply: ArrayReply<NullReply | BlobStringReply>) => {
        return reply.map(score => score === null ? null : Number(score));
    },
    3: undefined as unknown as () => ArrayReply<NullReply | DoubleReply>
  }
} as const satisfies Command;
