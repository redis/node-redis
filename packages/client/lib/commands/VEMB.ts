import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformDoubleArrayReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve the approximate vector associated with a vector set element
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VEMB');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
