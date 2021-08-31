import { transformReplyString } from './generic-transformers';

type HSETObject = Record<string | number, string | number>;

type HSETMap = Map<string | number, string | number>;

type HSETTuples = Array<[string, string]> | Array<string>;

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: HSETObject | HSETMap | HSETTuples): Array<string> {
    const args = ['HSET', key];

    if (value instanceof Map) {
        pushMap(args, value);
    } else if (Array.isArray(value)) {
        pushTuples(args, value);
    } else if (typeof value === 'object' && value !== null) {
        pushObject(args, value);
    }

    return args;
}

function pushMap(args: Array<string>, map: HSETMap): void {
    for (const [key, value] of map.entries()) {
        args.push(key.toString(), value.toString());
    }
}

function pushTuples(args: Array<string>, tuples: HSETTuples): void {
    args.push(...tuples.flat());
}

function pushObject(args: Array<string>, object: HSETObject): void {
    for (const key of Object.keys(object)) {
        args.push(key.toString(), object[key].toString());
    }
}

export const transformReply = transformReplyString;
