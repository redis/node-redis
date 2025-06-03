import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Resets a t-digest sketch, clearing all previously added observations
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch to reset
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TDIGEST.RESET');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
