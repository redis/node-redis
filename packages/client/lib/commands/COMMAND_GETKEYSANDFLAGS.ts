import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(args: Array<RedisCommandArgument>): RedisCommandArguments {
    return ['COMMAND', 'GETKEYSANDFLAGS', ...args];
}

type KeysAndFlagsRawReply = [RedisCommandArgument, RedisCommandArguments];

type KeysAndFlagsReply = {
    key: RedisCommandArgument;
    flags: RedisCommandArguments;
};

export function transformReply(reply: Array<KeysAndFlagsRawReply>): Array<KeysAndFlagsReply> {
    return reply.map(KeyAndFlags => {
        return {
            // key: String(KeyAndFlags[0]),
            // flags: KeyAndFlags[1].map(String)
            key: KeyAndFlags[0],
            flags: KeyAndFlags[1]
        };
    });
}
