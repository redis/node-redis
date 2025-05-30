import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the OBJECT REFCOUNT command
   * 
   * @param parser - The command parser
   * @param key - The key to get the reference count for
   * @see https://redis.io/commands/object-refcount/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('OBJECT', 'REFCOUNT');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
