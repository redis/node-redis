import { RedisArgument, CommandArguments, Command } from '../RESP/types';
import GEORADIUSBYMEMBER from './GEORADIUSBYMEMBER';
import { GeoSearchOptions, GeoUnits, pushGeoSearchOptions } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function transformGeoRadiusByMemberWithArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) {
  const args: CommandArguments = [
    command,
    key,
    from,
    radius.toString(),
    unit
  ];

  pushGeoSearchOptions(args, options);

  args.push(...replyWith);
  args.preserve = replyWith;

  return args;
}

export default {
  FIRST_KEY_INDEX: GEORADIUSBYMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUSBYMEMBER.IS_READ_ONLY,
  transformArguments: transformGeoRadiusByMemberWithArguments.bind(undefined, 'GEORADIUSBYMEMBER'),
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;