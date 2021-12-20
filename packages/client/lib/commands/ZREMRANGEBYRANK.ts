import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    start: number,
    stop: number
): RedisCommandArguments {
    return ['ZREMRANGEBYRANK', key, start.toString(), stop.toString()];
}

export declare function transformReply(): number;
