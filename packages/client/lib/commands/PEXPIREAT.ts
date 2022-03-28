import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformPXAT } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    millisecondsTimestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
): RedisCommandArguments {
    const args = [
        'PEXPIREAT',
        key,
        transformPXAT(millisecondsTimestamp)
    ];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export { transformBooleanReply as transformReply } from './generic-transformers';
