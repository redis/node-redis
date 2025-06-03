import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NullReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { createTransformNullableDoubleReplyResp2Func, RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the scores associated with the specified members in the sorted set stored at key.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param member - One or more members to get scores for.
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisVariadicArgument) {
    parser.push('ZMSCORE');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformReply: {
    2: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      return reply.map(createTransformNullableDoubleReplyResp2Func(preserve, typeMapping));
    },
    3: undefined as unknown as () => ArrayReply<NullReply | DoubleReply>
  }
} as const satisfies Command;
