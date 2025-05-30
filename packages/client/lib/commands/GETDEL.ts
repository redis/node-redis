import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Gets the value of a key and deletes the key
   * @param parser - The Redis command parser
   * @param key - Key to get and delete
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GETDEL');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
