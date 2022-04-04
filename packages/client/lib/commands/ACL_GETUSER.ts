import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(username: RedisCommandArgument): RedisCommandArguments {
    return ['ACL', 'GETUSER', username];
}

type AclGetUserRawReply = [
    'flags',
    Array<RedisCommandArgument>,
    'passwords',
    Array<RedisCommandArgument>,
    'commands',
    RedisCommandArgument,
    'keys',
    Array<RedisCommandArgument> | RedisCommandArgument,
    'channels',
    Array<RedisCommandArgument> | RedisCommandArgument,
    'selectors' | undefined,
    Array<Array<string>> | undefined
];

interface AclUser {
    flags: Array<RedisCommandArgument>;
    passwords: Array<RedisCommandArgument>;
    commands: RedisCommandArgument;
    keys: Array<RedisCommandArgument> | RedisCommandArgument;
    channels: Array<RedisCommandArgument> | RedisCommandArgument;
    selectors?: Array<Array<string>>;
}

export function transformReply(reply: AclGetUserRawReply): AclUser {
    return {
        flags: reply[1],
        passwords: reply[3],
        commands: reply[5],
        keys: reply[7],
        channels: reply[9],
        selectors: reply[11]
    };
}
