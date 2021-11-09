import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments } from './generic-transformers';

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

export function transformReply(reply: number): number {
    if (typeof reply !== 'number') {
        throw new TypeError(`https://github.com/redis/redis/issues/9261`);
    }

    return reply;
}
