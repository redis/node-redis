import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoUnits } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member1: RedisCommandArgument,
    member2: RedisCommandArgument,
    unit?: GeoUnits
): RedisCommandArguments {
    const args = ['GEODIST', key, member1, member2];

    if (unit) {
        args.push(unit);
    }

    return args;
}

export function transformReply(reply: RedisCommandArgument | null): number | null {
    return reply === null ? null : Number(reply);
}
