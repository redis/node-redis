import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoCoordinates, GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  parser.pushKey(key);
  parser.push(from.longitude.toString(), from.latitude.toString(), radius.toString(), unit);

  parseGeoSearchOptions(parser, options)
}

export default {
  IS_READ_ONLY: false,
  parseCommand(...args: Parameters<typeof parseGeoRadiusArguments>) {
    args[0].push('GEORADIUS');
    return parseGeoRadiusArguments(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

