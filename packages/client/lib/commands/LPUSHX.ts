import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Constructs the LPUSHX command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param elements - One or more elements to push to the list if it exists
   * @see https://redis.io/commands/lpushx/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, elements: RedisVariadicArgument) {
    parser.push('LPUSHX');
    parser.pushKey(key);
    parser.pushVariadic(elements);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
