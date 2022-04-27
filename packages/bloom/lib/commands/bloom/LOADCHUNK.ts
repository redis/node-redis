import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: string,
    iteretor: number,
    chunk: RedisCommandArgument
): RedisCommandArguments {
    return ['BF.LOADCHUNK', key, iteretor.toString(), chunk];
}

export declare function transformReply(): 'OK';
