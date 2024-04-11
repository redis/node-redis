import { RedisArgument, CommandArguments, ArrayReply, BlobStringReply, Command } from '../RESP/types';

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

export function pushGeoSearchArguments(
  args: CommandArguments,
  key: RedisArgument,
  from: GeoSearchFrom,
  by: GeoSearchBy,
  options?: GeoSearchOptions
) {
  args.push(key);

  if (typeof from === 'string' || from instanceof Buffer) {
    args.push('FROMMEMBER', from);
  } else {
    args.push('FROMLONLAT', from.longitude.toString(), from.latitude.toString());
  }

  if ('radius' in by) {
    args.push('BYRADIUS', by.radius.toString(), by.unit);
  } else {
    args.push('BYBOX', by.width.toString(), by.height.toString(), by.unit);
  }

  pushGeoSearchOptions(args, options);

  return args;
}

export type GeoCountArgument = number | {
  value: number;
  ANY?: boolean;
};

export interface GeoSearchOptions {
  SORT?: 'ASC' | 'DESC';
  COUNT?: GeoCountArgument;
}

export function pushGeoSearchOptions(
  args: CommandArguments,
  options?: GeoSearchOptions
) {
  if (options?.SORT) {
    args.push(options.SORT);
  }

  if (options?.COUNT) {
    if (typeof options.COUNT === 'number') {
      args.push('COUNT', options.COUNT.toString());
    } else {
      args.push('COUNT', options.COUNT.value.toString());
  
      if (options.COUNT.ANY) {
        args.push('ANY');
      }
    }
  }
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
  ) {
    return pushGeoSearchArguments(['GEOSEARCH'], key, from, by, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
