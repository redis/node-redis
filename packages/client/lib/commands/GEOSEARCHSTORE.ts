import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, parseGeoSearchArguments } from './GEOSEARCH';

export interface GeoSearchStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Searches a geospatial index and stores the results in a new sorted set
   * @param parser - The Redis command parser
   * @param destination - Key to store the results
   * @param source - Key of the geospatial index to search
   * @param from - Center point of the search (member name or coordinates)
   * @param by - Search area specification (radius or box dimensions)
   * @param options - Additional search and storage options
   */
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    source: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
  ) {
    parser.push('GEOSEARCHSTORE');

    if (destination !== undefined) {
      parser.pushKey(destination);
    }
  
    parseGeoSearchArguments(parser, source, from, by, options);

    if (options?.STOREDIST) {
      parser.push('STOREDIST');
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
