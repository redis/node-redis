import { transformReplyNumberInfinity, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return [
        'ZPOPMIN',
        key
    ];
}

export function transformReply(reply: [string, string] | []): ZMember | null {
    if (!reply.length) return null;
    
    return {
        value: reply[0],
        score: transformReplyNumberInfinity(reply[1])
    };
}
