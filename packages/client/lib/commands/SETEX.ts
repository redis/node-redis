import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the SETEX command
   * 
   * @param parser - The command parser
   * @param key - The key to set
   * @param seconds - The expiration time in seconds
   * @param value - The value to set
   * @see https://redis.io/commands/setex/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, seconds: number, value: RedisArgument) {
    parser.push('SETEX');
    parser.pushKey(key);
    parser.push(seconds.toString(), value);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
