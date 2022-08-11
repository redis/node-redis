import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    quantile: number | Array<number>
): RedisCommandArguments {
    const args = [
        'TDIGEST.QUANTILE',
        key
    ];

    if (Array.isArray(quantile)) {
        for (const q of quantile) {
            args.push(q.toString());
        }
    } else {
        args.push(quantile.toString());
    }

    return args;
}

type QuantileRawReply = Array<`${'nan' | number}`>;

export function transfromReply(reply: QuantileRawReply): Array<number> {
    return reply.map(num => num === 'nan' ? NaN : Number(num));
}
