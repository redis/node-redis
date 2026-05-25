import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export const REDIS_FLUSH_MODES = {
  ASYNC: 'ASYNC',
  SYNC: 'SYNC'
} as const;

export type RedisFlushMode = typeof REDIS_FLUSH_MODES[keyof typeof REDIS_FLUSH_MODES];

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, mode?: RedisFlushMode) {
    parser.push('FLUSHALL');
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
