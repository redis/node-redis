import { BitFieldGetOperation } from './BITFIELD';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

type BitFieldRoOperations = Array<
    Omit<BitFieldGetOperation, 'operation'> &
    Partial<Pick<BitFieldGetOperation, 'operation'>>
>;

export function transformArguments(key: string, operations: BitFieldRoOperations): Array<string> {
    const args = ['BITFIELD_RO', key];

    for (const operation of operations) {
        args.push(
            'GET',
            operation.encoding,
            operation.offset.toString()
        );
    }

    return args;
}

export declare function transformReply(): Array<number | null>;
