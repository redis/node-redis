import { RedisArgument, NumberReply, Command } from '../RESP/types';
import GEORADIUSBYMEMBER, { transformGeoRadiusByMemberArguments } from './GEORADIUSBYMEMBER';
import { GeoSearchOptions, GeoUnits } from './GEOSEARCH';

export interface GeoRadiusStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  FIRST_KEY_INDEX: GEORADIUSBYMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUSBYMEMBER.IS_READ_ONLY,
  transformArguments(
    key: RedisArgument,
    from: RedisArgument,
    radius: number,
    unit: GeoUnits,
    destination: RedisArgument,
    options?: GeoRadiusStoreOptions
  ) {
    const args = transformGeoRadiusByMemberArguments('GEORADIUSBYMEMBER', key, from, radius, unit, options);

    if (options?.STOREDIST) {
      args.push('STOREDIST', destination);
    } else {
      args.push('STORE', destination);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
