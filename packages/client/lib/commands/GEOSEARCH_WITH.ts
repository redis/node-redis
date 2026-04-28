import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NumberReply, DoubleReply, Command } from '../RESP/types';
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

type GeoSearchWithRawMember = [
  BlobStringReply,
  ...(BlobStringReply | NumberReply | [DoubleReply, DoubleReply])[]
];

export default {
  IS_READ_ONLY: GEOSEARCH.IS_READ_ONLY,
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
    reply: Array<GeoSearchWithRawMember>,
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
        item.distance = raw[distanceIndex] as BlobStringReply;
      }
  
      if (hashIndex) {
        item.hash = raw[hashIndex] as NumberReply;
      }
  
      if (coordinatesIndex) {
        const [longitude, latitude] = raw[coordinatesIndex] as [DoubleReply, DoubleReply];
        item.coordinates = {
          longitude,
          latitude
        };
      }

      return item;
    });
  }
} as const satisfies Command;
