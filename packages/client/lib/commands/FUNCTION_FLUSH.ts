import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushModes } from './FLUSHALL';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(mode?: RedisFlushModes) {
    const args = ['FUNCTION', 'FLUSH'];
    
    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
