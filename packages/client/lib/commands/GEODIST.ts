import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { GeoUnits } from './GEOSEARCH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser,
    key: RedisArgument,
    member1: RedisArgument,
    member2: RedisArgument,
    unit?: GeoUnits
  ) {
    parser.push('GEODIST');
    parser.pushKey(key);
    parser.push(member1, member2);

    if (unit) {
      parser.push(unit);
    }
  },
  transformReply(reply: BlobStringReply | NullReply) {
    return reply === null ? null : Number(reply);
  }
} as const satisfies Command;
