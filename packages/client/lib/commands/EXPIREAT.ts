import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformEXAT } from './generic-transformers';

export default {
  /**
   * Sets the expiration for a key at a specific Unix timestamp
   * @param parser - The Redis command parser
   * @param key - Key to set expiration on
   * @param timestamp - Unix timestamp (seconds since January 1, 1970) or Date object
   * @param mode - Expiration mode: NX (only if key has no expiry), XX (only if key has existing expiry), GT (only if new expiry is greater than current), LT (only if new expiry is less than current)
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('EXPIREAT');
    parser.pushKey(key);
    parser.push(transformEXAT(timestamp));
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
