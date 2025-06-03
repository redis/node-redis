import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import GEOSEARCH, { GeoSearchBy, GeoSearchFrom, GeoSearchOptions } from './GEOSEARCH';

export const GEO_REPLY_WITH = {
  DISTANCE: 'WITHDIST',
  HASH: 'WITHHASH',
  COORDINATES: 'WITHCOORD'
} as const;

export type GeoReplyWith = typeof GEO_REPLY_WITH[keyof typeof GEO_REPLY_WITH];

export interface GeoReplyWithMember {
  member: BlobStringReply;
  distance?: BlobStringReply;
  hash?: NumberReply;
  coordinates?: {
    longitude: DoubleReply;
    latitude: DoubleReply;
  };
}

export default {
  IS_READ_ONLY: GEOSEARCH.IS_READ_ONLY,
  /**
   * Queries members inside an area of a geospatial index with additional information
   * @param parser - The Redis command parser
   * @param key - Key of the geospatial index
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param replyWith - Information to include with each returned member
   * @param options - Additional search options
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
  ) {
    GEOSEARCH.parseCommand(parser, key, from, by, options);
    parser.push(...replyWith);
    parser.preserve = replyWith;
  },
  transformReply(
    reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, ...Array<any>]>>>,
    replyWith: Array<GeoReplyWith>
  ) {
    const replyWithSet = new Set(replyWith);
    let index = 0;
    const distanceIndex = replyWithSet.has(GEO_REPLY_WITH.DISTANCE) && ++index,
      hashIndex = replyWithSet.has(GEO_REPLY_WITH.HASH) && ++index,
      coordinatesIndex = replyWithSet.has(GEO_REPLY_WITH.COORDINATES) && ++index;
    
    return reply.map(raw => {
      const unwrapped = raw as unknown as UnwrapReply<typeof raw>;

      const item: GeoReplyWithMember = {
        member: unwrapped[0]
      };

      if (distanceIndex) {
        item.distance = unwrapped[distanceIndex];
      }
  
      if (hashIndex) {
        item.hash = unwrapped[hashIndex];
      }
  
      if (coordinatesIndex) {
        const [longitude, latitude] = unwrapped[coordinatesIndex];
        item.coordinates = {
          longitude,
          latitude
        };
      }

      return item;
    });
  }
} as const satisfies Command;
