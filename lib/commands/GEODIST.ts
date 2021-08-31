import { GeoUnits } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: string,
    member1: string,
    member2: string,
    unit?: GeoUnits
): Array<string> {
    const args = ['GEODIST', key, member1, member2];

    if (unit) {
        args.push(unit);
    }

    return args;
}

export function transformReply(reply: string | null): number | null {
    return reply === null ? null : Number(reply);
}
