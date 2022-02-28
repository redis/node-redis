import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['OBJECT', 'REFCOUNT', key];
}

export declare function transformReply(): number;
