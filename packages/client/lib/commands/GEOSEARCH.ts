import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export type GeoUnits = 'm' | 'km' | 'mi' | 'ft';

export interface GeoCoordinates {
  longitude: RedisArgument | number;
  latitude: RedisArgument | number;
}

export type GeoSearchFrom = RedisArgument | GeoCoordinates;

export interface GeoSearchByRadius {
  radius: number;
  unit: GeoUnits;
}

export interface GeoSearchByBox {
  width: number;
  height: number;
  unit: GeoUnits;
}

export type GeoSearchBy = GeoSearchByRadius | GeoSearchByBox;

export function parseGeoSearchArguments(
  parser: CommandParser,
  command: RedisArgument,
  key: RedisArgument,
  from: GeoSearchFrom,
  by: GeoSearchBy,
  options?: GeoSearchOptions,
  store?: RedisArgument
) {
  parser.push(command);

  if (store !== undefined) {
    parser.pushKey(store);
  }

  parser.pushKey(key);

  if (typeof from === 'string' || from instanceof Buffer) {
    parser.pushVariadic(['FROMMEMBER', from]);
  } else {
    parser.pushVariadic(['FROMLONLAT', from.longitude.toString(), from.latitude.toString()]);
  }

  if ('radius' in by) {
    parser.pushVariadic(['BYRADIUS', by.radius.toString(), by.unit]);
  } else {
    parser.pushVariadic(['BYBOX', by.width.toString(), by.height.toString(), by.unit]);
  }

  parseGeoSearchOptions(parser, options);
}

export type GeoCountArgument = number | {
  value: number;
  ANY?: boolean;
};

export interface GeoSearchOptions {
  SORT?: 'ASC' | 'DESC';
  COUNT?: GeoCountArgument;
}

export function parseGeoSearchOptions(
  parser: CommandParser,
  options?: GeoSearchOptions
) {
  if (options?.SORT) {
    parser.push(options.SORT);
  }

  if (options?.COUNT) {
    if (typeof options.COUNT === 'number') {
      parser.pushVariadic(['COUNT', options.COUNT.toString()]);
    } else {
      parser.pushVariadic(['COUNT', options.COUNT.value.toString()]);
  
      if (options.COUNT.ANY) {
        parser.push('ANY');
      }
    }
  }
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
  ) {
    parseGeoSearchArguments(parser, 'GEOSEARCH', key, from, by, options);
  },
  transformArguments(
    key: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
  ) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
