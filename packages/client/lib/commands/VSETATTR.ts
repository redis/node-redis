import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformBooleanReply } from './generic-transformers';

export default {
  /**
   * Set or replace attributes on a vector set element
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param element - The name of the element to set attributes for
   * @param attributes - The attributes to set (as JSON string or object)
   * @see https://redis.io/commands/vsetattr/
   */
  parseCommand(
    parser: CommandParser, 
    key: RedisArgument, 
    element: RedisArgument, 
    attributes: RedisArgument | Record<string, any>
  ) {
    parser.push('VSETATTR');
    parser.pushKey(key);
    parser.push(element);
    
    if (typeof attributes === 'object' && attributes !== null) {
      parser.push(JSON.stringify(attributes));
    } else {
      parser.push(attributes);
    }
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
