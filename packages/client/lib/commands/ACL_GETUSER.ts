import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(username: RedisCommandArgument): RedisCommandArguments {
    return ['ACL', 'GETUSER', username];
}

type AclGetUserRawReply = [
    _: RedisCommandArgument,
    flags: Array<RedisCommandArgument>,
    _: RedisCommandArgument,
    passwords: Array<RedisCommandArgument>,
    _: RedisCommandArgument,
    commands: RedisCommandArgument,
    _: RedisCommandArgument,
    keys: Array<RedisCommandArgument>,
    _: RedisCommandArgument,
    channels: Array<RedisCommandArgument>
];

interface AclUser {
    flags: Array<RedisCommandArgument>;
    passwords: Array<RedisCommandArgument>;
    commands: RedisCommandArgument;
    keys: Array<RedisCommandArgument>;
    channels: Array<RedisCommandArgument>
}

export function transformReply(reply: AclGetUserRawReply): AclUser {
    return {
        flags: reply[1],
        passwords: reply[3],
        commands: reply[5],
        keys: reply[7],
        channels: reply[9]
    };
}
