import { transformReplyNumberInfinity, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count?: number): Array<string> {
    const args = [
        'ZPOPMAX',
        key
    ];

    if (typeof count === 'number') {
        args.push(count.toString());
    }

    return args;
}

export function transformReply(reply: [string, string] | []): ZMember | null {
    if (!reply.length) return null;
    
    return {
        value: reply[0],
        score: transformReplyNumberInfinity(reply[1])
    };
}
