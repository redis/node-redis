import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER, { parseGeoRadiusByMemberArguments } from './GEORADIUSBYMEMBER';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param options - Additional search options
   */
  parseCommand(...args: Parameters<typeof parseGeoRadiusByMemberArguments>) {
    const parser = args[0];
    parser.push('GEORADIUSBYMEMBER_RO');
    parseGeoRadiusByMemberArguments(...args);
  },
  transformReply: GEORADIUSBYMEMBER.transformReply
} as const satisfies Command;
