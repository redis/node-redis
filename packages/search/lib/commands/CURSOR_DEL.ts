import { RedisCommandArgument } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(index: RedisCommandArgument, cursorId: number) {
    return [
        'FT.CURSOR',
        'DEL',
        index,
        cursorId.toString()
    ];
}

export declare function transformReply(): 'OK';
