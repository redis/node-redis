import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes the specified members from the sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param member - One or more members to remove.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    parser.push('ZREM');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
