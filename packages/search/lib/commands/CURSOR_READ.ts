import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface CursorReadOptions {
    COUNT?: number;
}

export function transformArguments(
    index: RedisCommandArgument,
    cursor: number,
    options?: CursorReadOptions
): RedisCommandArguments {
    const args = [
        'FT.CURSOR',
        'READ',
        index,
        cursor.toString()
    ];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformReply } from './AGGREGATE_WITHCURSOR';
