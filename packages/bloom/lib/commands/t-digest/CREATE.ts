import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    compression: number
): RedisCommandArguments {
    return [
        'TDIGEST.CREATE',
        key,
        compression.toString()
    ];
}

export declare function transformReply(): 'OK';
