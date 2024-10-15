import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, offset: number) {
    return ['GETBIT', key, offset.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
