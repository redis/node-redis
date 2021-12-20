import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['SMEMBERS', key];
}

export declare function transformReply(): Array<RedisCommandArgument>;
