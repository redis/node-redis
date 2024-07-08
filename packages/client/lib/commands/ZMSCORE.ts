import { RedisArgument, ArrayReply, NullReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument, transformNullableDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisVariadicArgument) {
    parser.setCachable();
    parser.push('ZMSCORE');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformArguments(
    key: RedisArgument,
    member: RedisVariadicArgument
  ) { return [] },
  transformReply: {
    2: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) => {
      return reply.map(transformNullableDoubleReply[2]);
    },
    3: undefined as unknown as () => ArrayReply<NullReply | DoubleReply>
  }
} as const satisfies Command;
