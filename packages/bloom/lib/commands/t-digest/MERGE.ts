import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    toKey: RedisCommandArgument,
    fromKey: RedisCommandArgument
): RedisCommandArguments {
    return [
        'TS.MERGE',
        toKey,
        fromKey
    ];
}

export declare function transformReply(): 'OK';
