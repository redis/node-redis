import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, Command } from '../RESP/types';
import ZPOPMIN from './ZPOPMIN';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument) {
    return ['ZPOPMAX', key];
  },
  transformReply: ZPOPMIN.transformReply
} as const satisfies Command;
