export const IS_READ_ONLY = true;

export function transformArguments(key: string, count?: number, WITHSCORES?: true): Array<string> {
    const args = ['ZRANDMEMBER', key];

    if (typeof count === 'number') {
        args.push(count.toString());

        if (WITHSCORES) {
            args.push('WITHSCORES');
        }
    }

    return args;
}

// TODO: string when count is 1 or undefined, array when count is > 1, object when WITHSCORES
type ZRandMemberReply = string | Array<string> | null

export function transformReply(reply: ZRandMemberReply): ZRandMemberReply {
    return reply;
}
