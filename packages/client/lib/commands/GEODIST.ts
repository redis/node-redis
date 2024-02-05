import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { GeoUnits } from './GEOSEARCH';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    member1: RedisArgument,
    member2: RedisArgument,
    unit?: GeoUnits
  ) {
    const args = ['GEODIST', key, member1, member2];

    if (unit) {
      args.push(unit);
    }

    return args;
  },
  transformReply(reply: BlobStringReply | NullReply) {
    return reply === null ? null : Number(reply);
  }
} as const satisfies Command;
