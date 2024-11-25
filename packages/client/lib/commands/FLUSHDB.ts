import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushMode } from './FLUSHALL';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, mode?: RedisFlushMode) {
    parser.push('FLUSHDB');
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
