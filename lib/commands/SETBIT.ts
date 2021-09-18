import { TransformArgumentsReply } from '.';
import { BitValue, transformReplyBit } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, offset: number, value: BitValue): TransformArgumentsReply {
    return ['SETBIT', key, offset.toString(), value.toString()];
}

export const transformReply = transformReplyBit;
