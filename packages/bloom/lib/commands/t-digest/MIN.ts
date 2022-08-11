import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return [
        'TDIGEST.MIN',
        key
    ];
}

type MinRawReply = `${'DBL_MAX' | number}`;

export function transformReply(reply: MinRawReply): number {
    return reply === 'DBL_MAX' ? Infinity : Number(reply);
}
