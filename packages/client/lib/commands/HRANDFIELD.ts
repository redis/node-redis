import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HRANDFIELD command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash to get a random field from
   * @see https://redis.io/commands/hrandfield/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
