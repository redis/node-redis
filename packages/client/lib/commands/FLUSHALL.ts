import { SimpleStringReply, Command } from '../RESP/types';

export const REDIS_FLUSH_MODES = {
  ASYNC: 'ASYNC',
  SYNC: 'SYNC'
} as const;

export type RedisFlushMode = typeof REDIS_FLUSH_MODES[keyof typeof REDIS_FLUSH_MODES];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(mode?: RedisFlushMode) {
    const args = ['FLUSHALL'];
    
    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
