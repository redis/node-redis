import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { BitFieldGetOperation } from './BITFIELD';

export type BitFieldRoOperations = Array<
  Omit<BitFieldGetOperation, 'operation'>
>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, operations: BitFieldRoOperations) {
    const args = ['BITFIELD_RO', key];

    for (const operation of operations) {
      args.push(
        'GET',
        operation.encoding,
        operation.offset.toString()
      );
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
