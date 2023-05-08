import { ArrayReply, BlobStringReply, NumberReply, DoubleReply, Command, RedisArgument } from '../RESP/types';
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
  FIRST_KEY_INDEX: GEOSEARCH.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEOSEARCH.IS_READ_ONLY,
  transformArguments(
    key: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
  ) {
    const args = GEOSEARCH.transformArguments(key, from, by, options);
    args.push(...replyWith);
    args.preserve = replyWith;
    return args;
  },
  transformReply(
    reply: ArrayReply<[BlobStringReply, ...Array<any>]>,
    replyWith: Array<GeoReplyWith>
  ) {
    const replyWithSet = new Set(replyWith);
    let index = 0;
    const distanceIndex = replyWithSet.has(GEO_REPLY_WITH.DISTANCE) && ++index,
      hashIndex = replyWithSet.has(GEO_REPLY_WITH.HASH) && ++index,
      coordinatesIndex = replyWithSet.has(GEO_REPLY_WITH.COORDINATES) && ++index;
    
    return reply.map(raw => {
      const item: GeoReplyWithMember = {
        member: raw[0]
      };

      if (distanceIndex) {
        item.distance = raw[distanceIndex];
      }
  
      if (hashIndex) {
        item.hash = raw[hashIndex];
      }
  
      if (coordinatesIndex) {
        const [longitude, latitude] = raw[coordinatesIndex];
        item.coordinates = {
          longitude,
          latitude
        };
      }

      return item;
    });
  }
} as const satisfies Command;
