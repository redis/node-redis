import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusByMemberArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  parser.pushKey(key);
  parser.push(from, radius.toString(), unit);

  parseGeoSearchOptions(parser, options);
}

export default {
  IS_READ_ONLY: false,
  /**
   * Queries members in a geospatial index based on a radius from a member
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: RedisArgument,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions
  ) {
    parser.push('GEORADIUSBYMEMBER');
    parseGeoRadiusByMemberArguments(parser, key, from, radius, unit, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
