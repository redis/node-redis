import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    offset: number,
    value: BitValue
  ) {
    return ['SETBIT', key, offset.toString(), value.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
