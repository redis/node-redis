import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['OBJECT', 'FREQ', key];
}

export declare function transformReply(): number | null;
