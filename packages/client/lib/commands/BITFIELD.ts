import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '../RESP/types';

export type BitFieldEncoding = `${'i' | 'u'}${number}`;

export interface BitFieldOperation<S extends string> {
  operation: S;
}

export interface BitFieldGetOperation extends BitFieldOperation<'GET'> {
  encoding: BitFieldEncoding;
  offset: number | string;
}

export interface BitFieldSetOperation extends BitFieldOperation<'SET'> {
  encoding: BitFieldEncoding;
  offset: number | string;
  value: number;
}

export interface BitFieldIncrByOperation extends BitFieldOperation<'INCRBY'> {
  encoding: BitFieldEncoding;
  offset: number | string;
  increment: number;
}

export interface BitFieldOverflowOperation extends BitFieldOperation<'OVERFLOW'> {
  behavior: string;
}

export type BitFieldOperations = Array<
  BitFieldGetOperation |
  BitFieldSetOperation |
  BitFieldIncrByOperation |
  BitFieldOverflowOperation
>;

export type BitFieldRoOperations = Array<
  Omit<BitFieldGetOperation, 'operation'>
>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, operations: BitFieldOperations) {
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
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
