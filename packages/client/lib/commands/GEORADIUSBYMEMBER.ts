import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoUnits, GeoSearchOptions, pushGeoSearchOptions } from './GEOSEARCH';

export function transformGeoRadiusByMemberArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: RedisArgument,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  const args = [
    command,
    key,
    from,
    radius.toString(),
    unit
  ];

  pushGeoSearchOptions(args, options);

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments: transformGeoRadiusByMemberArguments.bind(undefined, 'GEORADIUSBYMEMBER'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
