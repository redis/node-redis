import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { RESP_TYPES } from '../RESP/decoder';
import GEOSEARCH, { GeoSearchBy, GeoSearchFrom, GeoSearchOptions } from './GEOSEARCH';
import { transformDoubleReply } from './generic-transformers';

export const GEO_REPLY_WITH = {
  DISTANCE: 'WITHDIST',
  HASH: 'WITHHASH',
  COORDINATES: 'WITHCOORD'
} as const;

export type GeoReplyWith = typeof GEO_REPLY_WITH[keyof typeof GEO_REPLY_WITH];

export interface GeoReplyWithMember {
  member: BlobStringReply;
  distance?: DoubleReply;
  hash?: NumberReply;
  coordinates?: {
    longitude: DoubleReply;
    latitude: DoubleReply;
  };
}

export default {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous tuple variance marker
    reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, ...Array<any>]>>>,
    replyWith: Array<GeoReplyWith>,
    typeMapping?: TypeMapping
  ) {
    const replyWithSet = new Set(replyWith);
    let index = 0;
    const distanceIndex = replyWithSet.has(GEO_REPLY_WITH.DISTANCE) && ++index,
      hashIndex = replyWithSet.has(GEO_REPLY_WITH.HASH) && ++index,
      coordinatesIndex = replyWithSet.has(GEO_REPLY_WITH.COORDINATES) && ++index;

    const doubleMapping = typeMapping ? typeMapping[RESP_TYPES.DOUBLE] : undefined;

    const parseDouble = (value: unknown) => {
      if (typeof value !== 'number') {
        return transformDoubleReply[2](value as BlobStringReply, undefined, typeMapping);
      }

      if (doubleMapping === String) {
        return value.toString() as unknown as DoubleReply;
      }

      return value as unknown as DoubleReply;
    };

    return reply.map(raw => {
      const unwrapped = raw as unknown as UnwrapReply<typeof raw>;

      const item: GeoReplyWithMember = {
        member: unwrapped[0]
      };

      if (distanceIndex) {
        item.distance = parseDouble(unwrapped[distanceIndex]);
      }

      if (hashIndex) {
        item.hash = unwrapped[hashIndex] as NumberReply;
      }

      if (coordinatesIndex) {
        const [longitude, latitude] = unwrapped[coordinatesIndex] as [DoubleReply, DoubleReply];
        item.coordinates = {
          longitude: parseDouble(longitude),
          latitude: parseDouble(latitude)
        };
      }

      return item;
    });
  }
} as const satisfies Command;
