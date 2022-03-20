import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformEXAT } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
): RedisCommandArguments {
    const args = [
        'EXPIREAT',
        key,
        transformEXAT(timestamp)
    ];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export { transformBooleanReply as transformReply } from './generic-transformers';
