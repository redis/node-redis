import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushMode } from './FLUSHALL';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, mode?: RedisFlushMode) {
    parser.push('FUNCTION', 'FLUSH');

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
