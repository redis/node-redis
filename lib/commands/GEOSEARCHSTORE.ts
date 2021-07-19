import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface GeoSearchStoreOptions extends GeoSearchOptions {
    STOREDIST?: true;
}

export function transformArguments(
    destination: string,
    source: string,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
): Array<string> {
    const args = pushGeoSearchArguments(
        ['GEOSEARCHSTORE', destination],
        source,
        from,
        by,
        options
    );

    if (options?.STOREDIST) {
        args.push('STOREDIST');
    }

    return args;
}


// in versions 6.2.0-6.2.4 Redis will return an empty array when `src` is empty
// TODO: issue/PR
export function transformReply(reply: number | []): number {
    if (typeof reply === 'number') return reply;

    return 0;
}
