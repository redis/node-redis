import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['CLIENT', 'TRACKINGINFO'];
}

type RawReply = [
    'flags',
    Array<string>,
    'redirect',
    number,
    'prefixes',
    Array<string>
];

interface Reply {
    flags: Set<string>;
    redirect: number;
    prefixes: Array<string>;
}

export function transformReply(reply: RawReply): Reply {
    return {
        flags: new Set(reply[1]),
        redirect: reply[3],
        prefixes: reply[5]
    };
}
