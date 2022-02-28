import { BitFieldGetOperation } from './BITFIELD';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, getOperation: BitFieldGetOperation): Array<string> {
    const args = ['BITFIELD_RO', key];

    args.push(
        'GET',
        getOperation.type,
        getOperation.offset.toString()
    );
    return args;
}

export declare function transformReply(): Array<number | null>;
