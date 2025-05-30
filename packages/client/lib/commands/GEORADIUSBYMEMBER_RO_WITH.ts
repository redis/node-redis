import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER_WITH, { parseGeoRadiusByMemberWithArguments } from './GEORADIUSBYMEMBER_WITH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Read-only variant that queries members in a geospatial index based on a radius from a member with additional information
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Member name to use as center point
   * @param radius - Radius of the search area
   * @param unit - Unit of distance (m, km, ft, mi)
   * @param withValues - Information to include with each returned member
   */
  parseCommand(...args: Parameters<typeof parseGeoRadiusByMemberWithArguments>) {
    const parser = args[0];
    parser.push('GEORADIUSBYMEMBER_RO');
    parseGeoRadiusByMemberWithArguments(...args);
  },
  transformReply: GEORADIUSBYMEMBER_WITH.transformReply
} as const satisfies Command;
