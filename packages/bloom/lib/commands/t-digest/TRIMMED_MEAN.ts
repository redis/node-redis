import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    lowCutPercentile: number,
    highCutPercentile: number
): RedisCommandArguments {
    return [
        'TDIGEST.TRIMMED_MEAN',
        key,
        lowCutPercentile.toString(),
        highCutPercentile.toString()
    ];
}

type TrimmedMinRawReply = `${'DBL_MAX' | number}`;

export function transformReply(reply: TrimmedMinRawReply): number {
    return reply === 'DBL_MAX' ? Infinity : Number(reply);
}