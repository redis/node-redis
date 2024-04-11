import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export type BitOperations = 'AND' | 'OR' | 'XOR' | 'NOT';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    operation: BitOperations,
    destKey: RedisArgument,
    key: RedisVariadicArgument
  ) {
    return pushVariadicArguments(['BITOP', operation, destKey], key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
