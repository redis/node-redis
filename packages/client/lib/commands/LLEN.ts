import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LLEN command
   * 
   * @param parser - The command parser
   * @param key - The key of the list to get the length of
   * @see https://redis.io/commands/llen/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('LLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
