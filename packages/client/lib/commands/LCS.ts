import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the LCS command (Longest Common Substring)
   * 
   * @param parser - The command parser
   * @param key1 - First key containing the first string
   * @param key2 - Second key containing the second string
   * @see https://redis.io/commands/lcs/
   */
  parseCommand(
    parser: CommandParser,
    key1: RedisArgument,
    key2: RedisArgument
  ) {
    parser.push('LCS');
    parser.pushKeys([key1, key2]);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
