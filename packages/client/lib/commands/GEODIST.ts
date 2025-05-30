import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { GeoUnits } from './GEOSEARCH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the distance between two members in a geospatial index
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param member1 - First member in the geospatial index
   * @param member2 - Second member in the geospatial index
   * @param unit - Unit of distance (m, km, ft, mi)
   */
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
