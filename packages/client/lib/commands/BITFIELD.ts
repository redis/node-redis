import { CommandParser } from '../client/parser';
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
  IS_READ_ONLY: false,
  /**
   * Performs arbitrary bitfield integer operations on strings
   * @param parser - The Redis command parser
   * @param key - The key holding the string
   * @param operations - Array of bitfield operations to perform: GET, SET, INCRBY or OVERFLOW
   */
  parseCommand(parser: CommandParser, key: RedisArgument, operations: BitFieldOperations) {
    parser.push('BITFIELD');
    parser.pushKey(key);

    for (const options of operations) {
      switch (options.operation) {
        case 'GET':
          parser.push(
            'GET',
            options.encoding,
            options.offset.toString()
          );
          break;

        case 'SET':
          parser.push(
            'SET',
            options.encoding,
            options.offset.toString(),
            options.value.toString()
          );
          break;

        case 'INCRBY':
          parser.push(
            'INCRBY',
            options.encoding,
            options.offset.toString(),
            options.increment.toString()
          );
          break;

        case 'OVERFLOW':
          parser.push(
            'OVERFLOW',
            options.behavior
          );
          break;
      }
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
