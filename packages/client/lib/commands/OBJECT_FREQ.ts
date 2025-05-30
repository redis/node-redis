import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the OBJECT FREQ command
   * 
   * @param parser - The command parser
   * @param key - The key to get the access frequency for
   * @see https://redis.io/commands/object-freq/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('OBJECT', 'FREQ');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
