import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';

export interface GeoRadiusStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  FIRST_KEY_INDEX: GEORADIUS.FIRST_KEY_INDEX,
  IS_READ_ONLY: GEORADIUS.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisArgument,
    options?: GeoRadiusStoreOptions
  ) {
    parseGeoRadiusArguments('GEORADIUS', false, parser, key, from, radius, unit, options);
    if (options?.STOREDIST) {
      parser.pushVariadic(['STOREDIST', destination]);
    } else {
      parser.pushVariadic(['STORE', destination])
    }
  },
  transformArguments(
    key: RedisArgument,
    from: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisArgument,
    options?: GeoRadiusStoreOptions
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
