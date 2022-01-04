import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

interface XGroupCreateOptions {
    MKSTREAM?: true;
}

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    id: RedisCommandArgument,
    options?: XGroupCreateOptions
): RedisCommandArguments {
    const args = ['XGROUP', 'CREATE', key, group, id];

    if (options?.MKSTREAM) {
        args.push('MKSTREAM');
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument;
