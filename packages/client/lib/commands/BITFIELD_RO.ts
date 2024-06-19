import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { BitFieldGetOperation } from './BITFIELD';

export type BitFieldRoOperations = Array<
  Omit<BitFieldGetOperation, 'operation'>
>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, operations: BitFieldRoOperations) {
    parser.setCachable();
    parser.push('BITFIELD_RO');
    parser.pushKey(key);

    for (const operation of operations) {
      parser.push('GET');
      parser.push(operation.encoding);
      parser.push(operation.offset.toString())
    }
  },
  transformArguments(key: RedisArgument, operations: BitFieldRoOperations) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
