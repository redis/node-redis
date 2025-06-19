import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve the dimension of the vectors in a vector set
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vdim/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('VDIM');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
