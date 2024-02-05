import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { GeoCoordinates, GeoUnits, GeoSearchOptions, pushGeoSearchOptions } from './GEOSEARCH';

export function transformGeoRadiusArguments(
  command: RedisArgument,
  key: RedisArgument,
  from: GeoCoordinates,
  radius: number,
  unit: GeoUnits,
  options?: GeoSearchOptions
) {
  const args = [
    command,
    key,
    from.longitude.toString(),
    from.latitude.toString(),
    radius.toString(),
    unit
  ];

  pushGeoSearchOptions(args, options);

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments: transformGeoRadiusArguments.bind(undefined, 'GEORADIUS'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

