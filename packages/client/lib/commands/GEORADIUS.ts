import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoCoordinates, GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  parser.pushKey(key);
  parser.push(from.longitude.toString(), from.latitude.toString(), radius.toString(), unit);

  parseGeoSearchOptions(parser, options)
}

export default {
  IS_READ_ONLY: false,
  /**
   * Queries members in a geospatial index based on a radius from a center point
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  parseCommand(...args: Parameters<typeof parseGeoRadiusArguments>) {
    args[0].push('GEORADIUS');
    return parseGeoRadiusArguments(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

