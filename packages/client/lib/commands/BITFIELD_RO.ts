import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { BitFieldGetOperation } from './BITFIELD';

export type BitFieldRoOperations = Array<
  Omit<BitFieldGetOperation, 'operation'>
>;

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, operations: BitFieldRoOperations) {
    parser.push('BITFIELD_RO');
    parser.pushKey(key);

    for (const operation of operations) {
      parser.push('GET');
      parser.push(operation.encoding);
      parser.push(operation.offset.toString())
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
