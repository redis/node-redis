import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Sets a key to a new value and returns its old value
   * @param parser - The Redis command parser
   * @param key - Key to set
   * @param value - Value to set
   */
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('GETSET');
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
