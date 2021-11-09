import { RedisCommandArguments } from '.';
import { pushVerdictArguments, transformReplyNumberInfinity, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Array<string>, timeout: number): RedisCommandArguments {
    const args = pushVerdictArguments(['BZPOPMIN'], key);

    args.push(timeout.toString());

    return args;
}

interface ZMemberWithKey extends ZMember {
    key: string;
}

type BZPopMinReply = ZMemberWithKey | null;

export function transformReply(reply: [key: string, value: string, score: string] | null): BZPopMinReply | null {
    if (!reply) return null;

    return {
        key: reply[0],
        value: reply[1],
        score: transformReplyNumberInfinity(reply[2])
    };
}
