import { CommandParser } from '../client/parser';
import { UnwrapReply, NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Removes and returns the first element in a list, or blocks until one is available
   * @param parser - The Redis command parser
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  parseCommand(parser: CommandParser, key: RedisVariadicArgument, timeout: number) {
    parser.push('BLPOP');
    parser.pushKeys(key);
    parser.push(timeout.toString());
  },
  transformReply(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply]>>) {
    if (reply === null) return null;

    return {
      key: reply[0],
      element: reply[1]
    };
  }
} as const satisfies Command;
