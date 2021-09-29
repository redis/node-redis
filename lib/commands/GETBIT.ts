import { BitValue } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, offset: number): Array<string> {
    return ['GETBIT', key, offset.toString()];
}

export declare function transformReply(): BitValue;
