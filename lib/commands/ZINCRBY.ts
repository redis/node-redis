import { transformArgumentNumberInfinity } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, increment: number, member: string): Array<string> {
    return [
        'ZINCRBY',
        key,
        transformArgumentNumberInfinity(increment),
        member
    ];
}

export { transformReplyNumberInfinity as transformReply } from './generic-transformers';
