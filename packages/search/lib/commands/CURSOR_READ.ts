import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    index: RedisCommandArgument,
    cursor: number
): RedisCommandArguments {
    return [
        'FT.CURSOR',
        'READ',
        index,
        cursor.toString()
    ];
}

export { transformReply } from './AGGREGATE_WITHCURSOR';
