import { CommandParser } from '../client/parser';
import { RedisArgument, Command, ArrayReply } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SPOP command to remove and return multiple random members from a set
   *
   * @param parser - The command parser
   * @param key - The key of the set to pop from
   * @param count - The number of members to pop
   * @see https://redis.io/commands/spop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('SPOP');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<string>
} as const satisfies Command;
