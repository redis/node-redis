import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export function transformArguments(operation: BitOperations, destKey: string, key: string | Array<string>): Array<string> {
    return pushVerdictArguments(['BITOP', operation, destKey], key);
}

export const transformReply = transformReplyNumber;
