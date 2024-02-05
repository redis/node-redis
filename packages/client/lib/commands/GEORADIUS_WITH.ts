import { CommandArguments, Command, RedisArgument } from '../RESP/types';
import GEORADIUS, { transformGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';
import GEOSEARCH_WITH, { GeoReplyWith } from './GEOSEARCH_WITH';

export function transformGeoRadiusWithArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  replyWith: Array<GeoReplyWith>,
  options?: GeoSearchOptions
) {
  const args: CommandArguments = transformGeoRadiusArguments(
    command,
    key,
    from,
    radius,
    unit,
    options
  );
  args.push(...replyWith);
  args.preserve = replyWith;
  return args;
}

export default {
  FIRST_KEY_INDEX: GEORADIUS.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUS.IS_READ_ONLY,
  transformArguments: transformGeoRadiusWithArguments.bind(undefined, 'GEORADIUS'),
  transformReply: GEOSEARCH_WITH.transformReply
} as const satisfies Command;
