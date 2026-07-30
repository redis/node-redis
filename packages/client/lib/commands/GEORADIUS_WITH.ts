import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import { parseGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function parseGeoRadiusWithArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions,
) {
  parseGeoRadiusArguments(parser, key, from, radius, unit, options)
  parser.pushVariadic(replyWith);
  parser.preserve = replyWith;
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
  ) {
    parser.push('GEORADIUS');
    parseGeoRadiusWithArguments(parser, key, from, radius, unit, replyWith, options);
  },
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;
