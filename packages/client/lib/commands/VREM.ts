import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformBooleanReply } from './generic-transformers';

export default {
  /**
   * Remove an element from a vector set
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param element - The name of the element to remove from the vector set
   * @see https://redis.io/commands/vrem/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VREM');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
