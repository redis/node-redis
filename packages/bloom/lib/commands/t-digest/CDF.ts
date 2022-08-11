import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    value: number
): RedisCommandArguments {
    return [
        'TDIGEST.CDF',
        key,
        value.toString()
    ];
}

export function transformReply(reply: string): number {
    return reply === 'nan' ? NaN : Number(reply);
}
