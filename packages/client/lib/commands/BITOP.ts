import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export default {
  IS_READ_ONLY: false,
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
