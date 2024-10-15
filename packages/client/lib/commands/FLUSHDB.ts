import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushMode } from './FLUSHALL';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(mode?: RedisFlushMode) {
    const args = ['FLUSHDB'];
    
    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
