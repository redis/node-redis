import { RedisArgument, NumberReply, Command } from '../RESP/types';
import GEORADIUS, { transformGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';

export interface GeoRadiusStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  FIRST_KEY_INDEX: GEORADIUS.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUS.IS_READ_ONLY,
  transformArguments(
    key: RedisArgument,
    from: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisArgument,
    options?: GeoRadiusStoreOptions
  ) {
    const args = transformGeoRadiusArguments('GEORADIUS', key, from, radius, unit, options);

    if (options?.STOREDIST) {
      args.push('STOREDIST', destination);
    } else {
      args.push('STORE', destination);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
