export function transformArguments(username: string): Array<string> {
    return ['ACL', 'GETUSER', username];
}

type AclGetUserRawReply = [
    _: string,
    flags: Array<string>,
    _: string,
    passwords: Array<string>,
    _: string,
    commands: string,
    _: string,
    keys: Array<string>,
    _: string,
    channels: Array<string>
];

interface AclUser {
    flags: Array<string>;
    passwords: Array<string>;
    commands: string;
    keys: Array<string>;
    channels: Array<string>
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
