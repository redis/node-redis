import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisFlushMode } from './FLUSHALL';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, mode?: RedisFlushMode) {
    parser.pushVariadic(['FUNCTION', 'FLUSH']);

    if (mode) {
      parser.push(mode);
    }
  },
  transformArguments(mode?: RedisFlushMode) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
