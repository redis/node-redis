import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { RedisFlushMode } from './FLUSHALL';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Deletes all the libraries and functions from a Redis server
   * @param parser - The Redis command parser
   * @param mode - Optional flush mode (ASYNC or SYNC)
   */
  parseCommand(parser: CommandParser, mode?: RedisFlushMode) {
    parser.push('FUNCTION', 'FLUSH');

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
