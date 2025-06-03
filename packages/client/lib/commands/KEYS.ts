import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the KEYS command
   * 
   * @param parser - The command parser
   * @param pattern - The pattern to match keys against
   * @see https://redis.io/commands/keys/
   */
  parseCommand(parser: CommandParser, pattern: RedisArgument) {
    parser.push('KEYS', pattern);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
