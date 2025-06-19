import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT' | 'DIFF' | 'DIFF1' | 'ANDOR' | 'ONE';

export default {
  IS_READ_ONLY: false,
  /**
   * Performs bitwise operations between strings
   * @param parser - The Redis command parser
   * @param operation - Bitwise operation to perform: AND, OR, XOR, NOT, DIFF, DIFF1, ANDOR, ONE
   * @param destKey - Destination key to store the result
   * @param key - Source key(s) to perform operation on
   */
  parseCommand(
    parser: CommandParser,
    operation: BitOperations,
    destKey: RedisArgument,
    key: RedisVariadicArgument
  ) {
      parser.push('BITOP', operation);
      parser.pushKey(destKey);
      parser.pushKeys(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
