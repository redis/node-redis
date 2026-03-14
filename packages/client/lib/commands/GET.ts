import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets the value of a key
   * @param parser - The Redis command parser
   * @param key - Key to get the value of
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GET');
    parser.pushKey(key);
  },
  transformReply: (reply: BlobStringReply | NullReply): string | null => {
    if (reply === null) return null;
    if (Buffer.isBuffer(reply))
      return reply.toString('utf8');
    return (reply as unknown as string);
  }
} as const satisfies Command;
