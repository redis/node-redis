import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusByMemberArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  parser.pushKey(key);
  parser.push(from, radius.toString(), unit);

  parseGeoSearchOptions(parser, options);
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: RedisArgument,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions
  ) {
    parser.push('GEORADIUSBYMEMBER');
    parseGeoRadiusByMemberArguments(parser, key, from, radius, unit, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
