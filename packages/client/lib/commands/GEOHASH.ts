import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the Geohash string representation of one or more position members
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisVariadicArgument) {
    parser.push('GEOHASH');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
