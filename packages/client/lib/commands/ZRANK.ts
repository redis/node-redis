import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the rank of a member in the sorted set, with scores ordered from low to high.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param member - Member to get the rank for.
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('ZRANK');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
