export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, member: string | Array<string>): Array<string> {
    const args = ['GEOPOS', key];

    if (typeof member === 'string') {
        args.push(member);
    } else {
        args.push(...member);
    }

    return args;
}

interface GeoCoordinates {
    longitude: string;
    latitude: string;
}

export function transformReply(reply: Array<[string, string] | null>): Array<GeoCoordinates | null> {
    return reply.map(coordinates => coordinates === null ? null : {
        longitude: coordinates[0],
        latitude: coordinates[1]
    });
}
