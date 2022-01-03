import { RedisCommandArgument, RedisCommandArguments } from '.';

type Types = RedisCommandArgument | number;

type HSETObject = Record<string | number, Types>;

type HSETMap = Map<Types, Types>;

type HSETTuples = Array<[Types, Types]> | Array<Types>;

export const FIRST_KEY_INDEX = 1;

type GenericArguments = [key: RedisCommandArgument];

type SingleFieldArguments = [...generic: GenericArguments, field: Types, value: Types];

type MultipleFieldsArguments = [...generic: GenericArguments, value: HSETObject | HSETMap | HSETTuples];

export function transformArguments(...[ key, value, fieldValue ]: SingleFieldArguments | MultipleFieldsArguments): RedisCommandArguments {
    const args: RedisCommandArguments = ['HSET', key];

    if (typeof value === 'string' || typeof value === 'number' || Buffer.isBuffer(value)) {
        pushValue(args, value);
        pushValue(args, fieldValue!);
    } else if (value instanceof Map) {
        pushMap(args, value);
    } else if (Array.isArray(value)) {
        pushTuples(args, value);
    } else {
        pushObject(args, value);
    }

    return args;
}

function pushMap(args: RedisCommandArguments, map: HSETMap): void {
    for (const [key, value] of map.entries()) {
        pushValue(args, key);
        pushValue(args, value);
    }
}

function pushTuples(args: RedisCommandArguments, tuples: HSETTuples): void {
    for (const tuple of tuples) {
        if (Array.isArray(tuple)) {
            pushTuples(args, tuple);
            continue;
        }

        pushValue(args, tuple);
    }
}

function pushObject(args: RedisCommandArguments, object: HSETObject): void {
    for (const key of Object.keys(object)) {
        args.push(key.toString(), object[key].toString());
    }
}

function pushValue(args: RedisCommandArguments, value: Types): void {
    args.push(
        typeof value === 'number' ?
            value.toString() :
            value
    );
}

export declare function transformReply(): number;
