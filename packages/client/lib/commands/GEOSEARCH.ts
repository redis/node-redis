import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: string,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
): Array<string> {
    return pushGeoSearchArguments(['GEOSEARCH'], key, from, by, options);
}

export declare function transformReply(): Array<string>;
