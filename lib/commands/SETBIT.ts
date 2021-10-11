import { RedisCommandArguments } from '.';
import { BitValue } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, offset: number, value: BitValue): RedisCommandArguments {
    return ['SETBIT', key, offset.toString(), value.toString()];
}

export declare function transformReply(): BitValue;
