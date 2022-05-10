import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

interface XSetIdOptions {
    ENTRIESADDED?: number;
    MAXDELETEDID?: RedisCommandArgument;
}

export function transformArguments(
    key: RedisCommandArgument,
    lastId: RedisCommandArgument,
    options?: XSetIdOptions
): RedisCommandArguments {
    const args = ['XSETID', key, lastId];

    if (options?.ENTRIESADDED) {
        args.push('ENTRIESADDED', options.ENTRIESADDED.toString());
    }

    if (options?.MAXDELETEDID) {
        args.push('MAXDELETEDID', options.MAXDELETEDID);
    }

    return args;
}

export declare function transformReply(): 'OK';
