import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, parseGeoSearchArguments } from './GEOSEARCH';

export interface GeoSearchStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    source: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
  ) {
    parseGeoSearchArguments(parser, 'GEOSEARCHSTORE', source, from, by, options, destination);

    if (options?.STOREDIST) {
      parser.push('STOREDIST');
    }
  },
  transformArguments(
    destination: RedisArgument,
    source: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
