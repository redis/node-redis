import { transformReplyNumberInfinity } from './generic-transformers';
import { ZMember } from './ZADD';

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

// TODO return type should be `ZMember` when count is 1 or undefined
export function transformReply(reply: [string, string] | []): ZMember | null {
    if (!reply.length) return null;
    
    return {
        value: reply[0],
        score: transformReplyNumberInfinity(reply[1])
    };
}
