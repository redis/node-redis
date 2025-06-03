import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function parseGeoRadiusWithArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions,
) {
  parseGeoRadiusArguments(parser, key, from, radius, unit, options)
  parser.pushVariadic(replyWith);
  parser.preserve = replyWith;
}

export default {
  IS_READ_ONLY: GEORADIUS.IS_READ_ONLY,
  /**
   * Queries members in a geospatial index based on a radius from a center point with additional information
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
  ) {
    parser.push('GEORADIUS');
    parseGeoRadiusWithArguments(parser, key, from, radius, unit, replyWith, options);
  },
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;
