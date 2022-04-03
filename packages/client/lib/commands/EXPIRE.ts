import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    seconds: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
): RedisCommandArguments {
    const args = ['EXPIRE', key, seconds.toString()];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export { transformBooleanReply as transformReply } from './generic-transformers';
