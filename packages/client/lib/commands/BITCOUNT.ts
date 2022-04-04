import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface BitCountRange {
    start: number;
    end: number;
    mode?: 'BYTE' | 'BIT';
}

export function transformArguments(
    key: RedisCommandArgument,
    range?: BitCountRange
): RedisCommandArguments {
    const args = ['BITCOUNT', key];

    if (range) {
        args.push(
            range.start.toString(),
            range.end.toString()
        );

        if (range.mode) {
            args.push(range.mode);
        }
    }

    return args;
}

export declare function transformReply(): number;
