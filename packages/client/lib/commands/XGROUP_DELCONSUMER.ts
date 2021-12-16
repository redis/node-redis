import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    consumer: RedisCommandArgument
): RedisCommandArguments {
    return ['XGROUP', 'DELCONSUMER', key, group, consumer];
}

export declare function transformReply(): number;
