import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { GeoUnits } from './GEOSEARCH';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser,
    key: RedisArgument,
    member1: RedisArgument,
    member2: RedisArgument,
    unit?: GeoUnits
  ) {
    parser.setCachable();
    parser.push('GEODIST');
    parser.pushKey(key);
    parser.pushVariadic([member1, member2]);

    if (unit) {
      parser.push(unit);
    }
  },
  transformArguments(
    key: RedisArgument,
    member1: RedisArgument,
    member2: RedisArgument,
    unit?: GeoUnits
  ) { return [] },
  transformReply(reply: BlobStringReply | NullReply) {
    return reply === null ? null : Number(reply);
  }
} as const satisfies Command;
