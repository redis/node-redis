import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(
    dump: RedisCommandArgument,
    mode?: 'FLUSH' | 'APPEND' | 'REPLACE'
): RedisCommandArguments {
    const args = ['FUNCTION', 'RESTORE', dump];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): 'OK';
