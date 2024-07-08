import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import GEORADIUSBYMEMBER from './GEORADIUSBYMEMBER';
import { GeoSearchOptions, GeoUnits, parseGeoSearchOptions } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function parseGeoRadiusByMemberWithArguments(
  command: RedisArgument,
  cachable: boolean,
  parser: CommandParser,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) {
  if (cachable) {
    parser.setCachable();
  }

  parser.push(command);
  parser.pushKey(key);
  parser.pushVariadic([from, radius.toString(), unit]);
  parseGeoSearchOptions(parser, options);

  parser.pushVariadic(replyWith);
  parser.setPreserve(replyWith);
}

export function transformGeoRadiusByMemberWithArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: GEORADIUSBYMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUSBYMEMBER.IS_READ_ONLY,
  parseCommand: parseGeoRadiusByMemberWithArguments.bind(undefined, 'GEORADIUSBYMEMBER', false),
  transformArguments: transformGeoRadiusByMemberWithArguments.bind(undefined, 'GEORADIUSBYMEMBER'),
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;