import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: string,
    iterator: number,
    chunk: RedisCommandArgument
): RedisCommandArguments {
    return ['CF.LOADCHUNK', key, iterator.toString(), chunk];
}

export declare function transformReply(): 'OK';
