import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the TYPE command to determine the data type stored at key
   *
   * @param parser - The command parser
   * @param key - Key to check
   * @returns String reply: "none", "string", "list", "set", "zset", "hash", "stream"
   * @see https://redis.io/commands/type/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TYPE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
