import { CommandParser } from '../client/parser';
import { NullReply, TuplesReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { RedisVariadicArgument, transformDoubleReply } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns the member with the highest score in a sorted set, or blocks until one is available
   * @param parser - The Redis command parser
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, timeout: number) {
    parser.push('BZPOPMAX');
    parser.pushKeys(keys);
    parser.push(timeout.toString());
  },
  transformReply: {
    2(
      reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, BlobStringReply]>>,
      preserve?: any,
      typeMapping?: TypeMapping
    ) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: transformDoubleReply[2](reply[2], preserve, typeMapping)
      };
    },
    3(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, DoubleReply]>>) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: reply[2]
      };
    }
  }
} as const satisfies Command;

