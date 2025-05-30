import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Constructs the RPUSHX command
   * 
   * @param parser - The command parser
   * @param key - The list key to push to (only if it exists)
   * @param element - One or more elements to push
   * @see https://redis.io/commands/rpushx/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisVariadicArgument) {
    parser.push('RPUSHX');
    parser.pushKey(key);
    parser.pushVariadic(element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
