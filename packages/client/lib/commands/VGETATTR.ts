import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformRedisJsonNullReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve the attributes of a vector set element
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve attributes for
   * @see https://redis.io/commands/vgetattr/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VGETATTR');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;
