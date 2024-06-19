import { Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function parseGeoRadiusWithArguments(
  command: RedisArgument,
  cachable: boolean,
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) {
  parseGeoRadiusArguments(command, cachable, parser, key, from, radius, unit, options)
  parser.pushVariadic(replyWith);
  parser.setPreserve(replyWith);
}

export function transformGeoRadiusWithArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: GEORADIUS.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUS.IS_READ_ONLY,
  parseCommand: parseGeoRadiusWithArguments.bind(undefined, 'GEORADIUS', false),
  transformArguments: transformGeoRadiusWithArguments.bind(undefined, 'GEORADIUS'),
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;
