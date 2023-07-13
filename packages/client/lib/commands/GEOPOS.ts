import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    return pushVariadicArguments(['GEOPOS', key], member);
  },
  transformReply(reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]> | NullReply>>) {
    return reply.map(item => {
      const unwrapped = item as unknown as UnwrapReply<typeof item>;
      return unwrapped === null ? null : {
        longitude: unwrapped[0],
        latitude: unwrapped[1]
      };
    });
  }
} as const satisfies Command;
