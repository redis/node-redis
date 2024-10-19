import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import GEORADIUSBYMEMBER from './GEORADIUSBYMEMBER';
import { GeoSearchOptions, GeoUnits, parseGeoSearchOptions } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function parseGeoRadiusByMemberWithArguments(
  parser: CommandParser,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) {
  parser.pushKey(key);
  parser.push(from, radius.toString(), unit);
  parseGeoSearchOptions(parser, options);

  parser.push(...replyWith);
  parser.setPreserve(replyWith);
}

export default {
  IS_READ_ONLY: GEORADIUSBYMEMBER.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: RedisArgument,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
  ) {
    parser.push('GEORADIUSBYMEMBER');
    parseGeoRadiusByMemberWithArguments(parser, key, from, radius, unit, replyWith, options);
  },
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;