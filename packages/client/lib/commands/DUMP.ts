import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns a serialized version of the value stored at the key
   * @param parser - The Redis command parser
   * @param key - Key to dump
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DUMP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
