export function transformArguments(count?: number): Array<string> {
    const args = ['ACL', 'LOG'];

    if (count) {
        args.push(count.toString());
    }

    return args;
}

type AclLogRawReply = [
    _: string,
    count: number,
    _: string,
    reason: string,
    _: string,
    context: string,
    _: string,
    object: string,
    _: string,
    username: string,
    _: string,
    ageSeconds: string,
    _: string,
    clientInfo: string
];

interface AclLog {
    count: number;
    reason: string;
    context: string;
    object: string;
    username: string;
    ageSeconds: number;
    clientInfo: string;
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
