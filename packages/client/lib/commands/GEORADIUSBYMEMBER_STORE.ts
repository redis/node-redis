import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { parseGeoRadiusByMemberArguments } from './GEORADIUSBYMEMBER';
import { GeoSearchOptions, GeoUnits } from './GEOSEARCH';

export interface GeoRadiusStoreOptions extends GeoSearchOptions {
  STOREDIST?: boolean;
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: RedisArgument,
    radius: number,
    unit: GeoUnits,
    destination: RedisArgument,
    options?: GeoRadiusStoreOptions
  ) {
    parser.push('GEORADIUSBYMEMBER')
    parseGeoRadiusByMemberArguments(parser, key, from, radius, unit, options);

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
