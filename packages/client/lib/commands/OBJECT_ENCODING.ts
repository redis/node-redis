import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the OBJECT ENCODING command
   * 
   * @param parser - The command parser
   * @param key - The key to get the internal encoding for
   * @see https://redis.io/commands/object-encoding/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('OBJECT', 'ENCODING');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
