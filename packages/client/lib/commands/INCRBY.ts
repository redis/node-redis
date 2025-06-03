import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the INCRBY command
   * 
   * @param parser - The command parser
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @see https://redis.io/commands/incrby/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, increment: number) {
    parser.push('INCRBY');
    parser.pushKey(key);
    parser.push(increment.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
