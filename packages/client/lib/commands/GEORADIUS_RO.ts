import { Command } from '../RESP/types';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a center point
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Center coordinates for the search
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  parseCommand(...args: Parameters<typeof parseGeoRadiusArguments>) {
    args[0].push('GEORADIUS_RO');
    parseGeoRadiusArguments(...args);
  },
  transformReply: GEORADIUS.transformReply
} as const satisfies Command;
