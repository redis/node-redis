export const FIRST_KEY_INDEX = 1;

export type BitFieldEncoding = `${'i' | 'u'}${number}`;

export interface BitFieldOperation<S extends string> {
    operation: S;
}

export interface BitFieldGetOperation extends BitFieldOperation<'GET'> {
    encoding: BitFieldEncoding;
    offset: number | string;
}

interface BitFieldSetOperation extends BitFieldOperation<'SET'> {
    encoding: BitFieldEncoding;
    offset: number | string;
    value: number;
}

interface BitFieldIncrByOperation extends BitFieldOperation<'INCRBY'> {
    encoding: BitFieldEncoding;
    offset: number | string;
    increment: number;
}

interface BitFieldOverflowOperation extends BitFieldOperation<'OVERFLOW'> {
    behavior: string;
}

type BitFieldOperations = Array<
    BitFieldGetOperation |
    BitFieldSetOperation |
    BitFieldIncrByOperation |
    BitFieldOverflowOperation
>;

export function transformArguments(key: string, operations: BitFieldOperations): Array<string> {
    const args = ['BITFIELD', key];

    for (const options of operations) {
        switch (options.operation) {
            case 'GET':
                args.push(
                    'GET',
                    options.encoding,
                    options.offset.toString()
                );
                break;

            case 'SET':
                args.push(
                    'SET',
                    options.encoding,
                    options.offset.toString(),
                    options.value.toString()
                );
                break;

            case 'INCRBY':
                args.push(
                    'INCRBY',
                    options.encoding,
                    options.offset.toString(),
                    options.increment.toString()
                );
                break;

            case 'OVERFLOW':
                args.push(
                    'OVERFLOW',
                    options.behavior
                );
                break;
        }
    }

    return args;
}

export declare function transformReply(): Array<number | null>;
