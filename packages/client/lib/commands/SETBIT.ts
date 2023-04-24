import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    offset: number,
    value: BitValue
  ) {
    return ['SETBIT', key, offset.toString(), value.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
