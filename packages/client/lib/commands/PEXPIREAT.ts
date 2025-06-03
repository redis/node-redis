import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformPXAT } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PEXPIREAT command
   * 
   * @param parser - The command parser
   * @param key - The key to set the expiration for
   * @param msTimestamp - The expiration timestamp in milliseconds (Unix timestamp or Date object)
   * @param mode - Optional mode for the command ('NX', 'XX', 'GT', 'LT')
   * @see https://redis.io/commands/pexpireat/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    msTimestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('PEXPIREAT');
    parser.pushKey(key);
    parser.push(transformPXAT(msTimestamp));

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
