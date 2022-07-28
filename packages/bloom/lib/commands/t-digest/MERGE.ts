import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    destKey: RedisCommandArgument,
    srcKey: RedisCommandArgument
): RedisCommandArguments {
    return [
        'TS.MERGE',
        destKey,
        srcKey
    ];
}

export declare function transformReply(): 'OK';
