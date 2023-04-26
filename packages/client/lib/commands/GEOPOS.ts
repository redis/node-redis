import { ArrayReply, BlobStringReply, NullReply, Command, RedisArgument } from '../RESP/types';
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
  transformReply(reply: ArrayReply<[BlobStringReply, BlobStringReply] | NullReply>) {
    return reply.map(item => item === null ? null : {
      longitude: item[0],
      latitude: item[1]
    });
  }
} as const satisfies Command;
