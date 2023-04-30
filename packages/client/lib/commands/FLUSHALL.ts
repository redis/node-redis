import { SimpleStringReply, Command } from '../RESP/types';

export const REDIS_FLUSH_MODES = {
  ASYNC: 'ASYNC',
  SYNC: 'SYNC'
} as const;

export type RedisFlushModes = typeof REDIS_FLUSH_MODES[keyof typeof REDIS_FLUSH_MODES];

export default {
  transformArguments(mode?: RedisFlushModes) {
    const args = ['FLUSHALL'];
    
    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
