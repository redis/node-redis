import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushModes } from './FLUSHALL';

export default {
  transformArguments(mode?: RedisFlushModes) {
    const args = ['FLUSHDB'];
    
    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
