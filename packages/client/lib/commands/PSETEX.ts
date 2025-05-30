import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the PSETEX command
   * 
   * @param parser - The command parser
   * @param key - The key to set
   * @param ms - The expiration time in milliseconds
   * @param value - The value to set
   * @see https://redis.io/commands/psetex/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, ms: number, value: RedisArgument) {
    parser.push('PSETEX');
    parser.pushKey(key);
    parser.push(ms.toString(), value);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
