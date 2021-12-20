import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(count?: number): RedisCommandArguments {
    const args = ['ACL', 'LOG'];

    if (count) {
        args.push(count.toString());
    }

    return args;
}

type AclLogRawReply = [
    _: RedisCommandArgument,
    count: number,
    _: RedisCommandArgument,
    reason: RedisCommandArgument,
    _: RedisCommandArgument,
    context: RedisCommandArgument,
    _: RedisCommandArgument,
    object: RedisCommandArgument,
    _: RedisCommandArgument,
    username: RedisCommandArgument,
    _: RedisCommandArgument,
    ageSeconds: RedisCommandArgument,
    _: RedisCommandArgument,
    clientInfo: RedisCommandArgument
];

interface AclLog {
    count: number;
    reason: RedisCommandArgument;
    context: RedisCommandArgument;
    object: RedisCommandArgument;
    username: RedisCommandArgument;
    ageSeconds: number;
    clientInfo: RedisCommandArgument;
}

export function transformReply(reply: Array<AclLogRawReply>): Array<AclLog> {
    return reply.map(log => ({
        count: log[1],
        reason: log[3],
        context: log[5],
        object: log[7],
        username: log[9],
        ageSeconds: Number(log[11]),
        clientInfo: log[13]
    }));
}
