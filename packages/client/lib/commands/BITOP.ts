import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    operation: BitOperations,
    destKey: RedisArgument,
    key: RedisVariadicArgument
  ) {
      parser.pushVariadic(['BITOP', operation]);
      parser.pushKey(destKey);
      parser.pushKeys(key);
  },
  transformArguments(
    operation: BitOperations,
    destKey: RedisArgument,
    key: RedisVariadicArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
