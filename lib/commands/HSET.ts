import { transformReplyString } from './generic-transformers';

type HSETObject = Record<string | number, string | number>;

type HSETMap = Map<string | number, string | number>;

export function transformArguments(key: string, objectOrMap: HSETObject | HSETMap): Array<string> {
    const flattenArgs = mapArgumentTransformer(key, objectOrMap) ??
        objectArgumentTransformer(key, objectOrMap) ??
        [];

    // TODO: add support for tuples

    flattenArgs.unshift('HSET');

    return flattenArgs;
}

function mapArgumentTransformer(key: string, map: HSETMap | unknown): Array<string> | undefined {
    if (!(map instanceof Map)) return;

    const flat = [key];
    for (const [key, value] of map.entries()) {
        flat.push(key.toString(), value.toString());
    }

    return flat;
}

function isObject(obj: HSETObject | unknown): obj is HSETObject {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function objectArgumentTransformer(key: string, obj: HSETObject | unknown): Array<string> | undefined {
    if (!isObject(obj)) {
        return;
    }

    const flat = [key];
    for (const key of Object.keys(obj)) {
        flat.push(key.toString(), obj[key].toString());
    }

    return flat;
}

export const transformReply = transformReplyString;
