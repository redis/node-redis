import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformBooleanReply } from './generic-transformers';

export default {
  parseCommand(
    parser: CommandParser, 
    key: RedisArgument, 
    element: RedisArgument, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
