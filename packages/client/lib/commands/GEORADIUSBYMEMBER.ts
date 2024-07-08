import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { GeoUnits, GeoSearchOptions, parseGeoSearchOptions } from './GEOSEARCH';

export function parseGeoRadiusByMemberArguments(
  command: RedisArgument,
  cachable: boolean,
  parser: CommandParser,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  if (cachable) {
    parser.setCachable();
  }

  parser.push(command);
  parser.pushKey(key);
  parser.pushVariadic([from, radius.toString(), unit]);

  parseGeoSearchOptions(parser, options);
}

export function transformGeoRadiusByMemberArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand: parseGeoRadiusByMemberArguments.bind(undefined, 'GEORADIUSBYMEMBER', false),
  transformArguments: transformGeoRadiusByMemberArguments.bind(undefined, 'GEORADIUSBYMEMBER'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
