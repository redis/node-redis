import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { GeoCoordinates, GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusArguments(
  command: RedisArgument,
  cachable: boolean,
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  if (cachable) {
    parser.setCachable();
  }

  parser.push(command);
  parser.pushKey(key);
  parser.pushVariadic([from.longitude.toString(), from.latitude.toString(), radius.toString(), unit]);

  parseGeoSearchOptions(parser, options)
}

export function transformGeoRadiusArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand: parseGeoRadiusArguments.bind(undefined, 'GEORADIUS', false),
  transformArguments: transformGeoRadiusArguments.bind(undefined, 'GEORADIUS'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

