import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(args: Array<RedisCommandArgument>): RedisCommandArguments {
    return ['COMMAND', 'GETKEYSANDFLAGS', ...args];
}

type KeysAndFlagsRawReply = Array<[
    RedisCommandArgument,
    RedisCommandArguments
]>;

type KeysAndFlagsReply = Array<{
    key: RedisCommandArgument;
    flags: RedisCommandArguments;
}>;

export function transformReply(reply: KeysAndFlagsRawReply): KeysAndFlagsReply {
    return reply.map(([key, flags]) => ({
        key,
        flags
    }));
}
