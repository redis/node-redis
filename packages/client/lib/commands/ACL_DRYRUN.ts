import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    username: RedisCommandArgument,
    command: Array<RedisCommandArgument>
): RedisCommandArguments {
    return [
        'ACL',
        'DRYRUN',
        username,
        ...command
    ];
}

export declare function transformReply(): RedisCommandArgument;

