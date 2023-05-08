import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments } from './GEOSEARCH';

export interface GeoSearchStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    source: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
  ) {
    const args = pushGeoSearchArguments(['GEOSEARCHSTORE', destination], source, from, by, options);

    if (options?.STOREDIST) {
      args.push('STOREDIST');
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
