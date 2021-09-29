export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

type BitFieldType = string; // TODO 'i[1-64]' | 'u[1-63]'

interface BitFieldOperation<S extends string> {
    operation: S;
}

interface BitFieldGetOperation extends BitFieldOperation<'GET'> {
    type: BitFieldType;
    offset: number | string;
}

interface BitFieldSetOperation extends BitFieldOperation<'SET'> {
    type: BitFieldType;
    offset: number | string;
    value: number;
}

interface BitFieldIncrByOperation extends BitFieldOperation<'INCRBY'> {
    type: BitFieldType;
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
                    options.type,
                    options.offset.toString()
                );
                break;

            case 'SET':
                args.push(
                    'SET',
                    options.type,
                    options.offset.toString(),
                    options.value.toString()
                );
                break;

            case 'INCRBY':
                args.push(
                    'INCRBY',
                    options.type,
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
