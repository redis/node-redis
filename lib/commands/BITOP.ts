import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export function transformArguments(operation: BitOperations, destKey: string, key: string | Array<string>): Array<string> {
    const args = ['BITOP', operation, destKey];

    if (typeof key === 'string') {
        args.push(key);
    } else {
        args.push(...key);
    }

    return args;
}

export const transformReply = transformReplyNumber;
