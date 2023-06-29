import { RedisArgument, Command } from '../RESP/types';
import ZPOPMAX from './ZPOPMAX';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument) {
    return ['ZPOPMIN', key];
  },
  transformReply: ZPOPMAX.transformReply
} as const satisfies Command;
