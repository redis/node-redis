import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SETBIT command
   * 
   * @param parser - The command parser
   * @param key - The key to set the bit on
   * @param offset - The bit offset (zero-based)
   * @param value - The bit value (0 or 1)
   * @see https://redis.io/commands/setbit/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number, value: BitValue) {
    parser.push('SETBIT');
    parser.pushKey(key);
    parser.push(offset.toString(), value.toString());
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
