import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export function transformArguments(operation: BitOperations, destKey: string, key: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['BITOP', operation, destKey], key);
}

export declare function transformReply(): number;
