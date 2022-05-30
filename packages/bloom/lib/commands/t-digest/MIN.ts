import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return [
        'TDIGEST.MIN',
        key
    ];
}

export function transformReply(reply: string): number {
    if (reply === 'DBL_MIN') {
        return -Infinity;
    }

    
}
