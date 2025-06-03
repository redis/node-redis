import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SMISMEMBER command
   * 
   * @param parser - The command parser
   * @param key - The set key to check membership in
   * @param members - The members to check for existence
   * @see https://redis.io/commands/smismember/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, members: Array<RedisArgument>) {
    parser.push('SMISMEMBER');
    parser.pushKey(key);
    parser.pushVariadic(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
