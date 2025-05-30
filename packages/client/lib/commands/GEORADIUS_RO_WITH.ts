import { Command } from '../RESP/types';
import { parseGeoRadiusWithArguments } from './GEORADIUS_WITH';
import GEORADIUS_WITH from './GEORADIUS_WITH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point with additional information
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  parseCommand(...args: Parameters<typeof parseGeoRadiusWithArguments>) {
    args[0].push('GEORADIUS_RO');
    parseGeoRadiusWithArguments(...args);
  },
  transformReply: GEORADIUS_WITH.transformReply
} as const satisfies Command;
