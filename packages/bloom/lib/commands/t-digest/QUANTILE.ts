import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { transformNumberReply } from '.';

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

export function transfromReply(reply: Array<string>): Record<number, number> {
    
    return reply.map(transformNumberReply);
}
