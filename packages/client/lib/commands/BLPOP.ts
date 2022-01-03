import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    keys: RedisCommandArgument | Array<RedisCommandArgument>,
    timeout: number
): RedisCommandArguments {
    const args = pushVerdictArguments(['BLPOP'], keys);

    args.push(timeout.toString());

    return args;
}

type BLPopRawReply = null | [RedisCommandArgument, RedisCommandArgument];

type BLPopReply = null | {
    key: RedisCommandArgument;
    element: RedisCommandArgument;
};

export function transformReply(reply: BLPopRawReply): BLPopReply {
    if (reply === null) return null;

    return {
        key: reply[0],
        element: reply[1]
    };
}
