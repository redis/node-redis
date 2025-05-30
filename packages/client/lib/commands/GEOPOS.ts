import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the longitude and latitude of one or more members in a geospatial index
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param member - One or more members in the geospatial index
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisVariadicArgument) {
    parser.push('GEOPOS');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformReply(reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]> | NullReply>>) {
    return reply.map(item => {
      const unwrapped = item as unknown as UnwrapReply<typeof item>;
      return unwrapped === null ? null : {
        longitude: unwrapped[0],
        latitude: unwrapped[1]
      };
    });
  }
} as const satisfies Command;
