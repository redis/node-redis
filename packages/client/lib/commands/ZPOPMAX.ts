import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { transformDoubleReply } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns the member with the highest score in the sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMAX');
    parser.pushKey(key);
  },
  transformReply: {
    2: (reply: UnwrapReply<TuplesReply<[] | [BlobStringReply, BlobStringReply]>>, preserve?: any, typeMapping?: TypeMapping) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: transformDoubleReply[2](reply[1], preserve, typeMapping),
      };
    },
    3: (reply: UnwrapReply<TuplesReply<[] | [BlobStringReply, DoubleReply]>>) => {
      if (reply.length === 0) return null;

      return {
        value: reply[0],
        score: reply[1]
      };
    }
  }
} as const satisfies Command;
