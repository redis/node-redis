import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SISMEMBER command
   * 
   * @param parser - The command parser
   * @param key - The set key to check membership in
   * @param member - The member to check for existence
   * @see https://redis.io/commands/sismember/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('SISMEMBER');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
