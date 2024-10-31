import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';
import { GeoCoordinates, GeoSearchOptions, GeoUnits } from './GEOSEARCH';

export interface GeoRadiusStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
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
    parser.push('GEORADIUS');
    parseGeoRadiusArguments(parser, key, from, radius, unit, options);
    if (options?.STOREDIST) {
      parser.push('STOREDIST');
      parser.pushKey(destination);
    } else {
      parser.push('STORE');
      parser.pushKey(destination);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
