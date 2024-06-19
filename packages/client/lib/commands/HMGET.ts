import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, fields: RedisVariadicArgument) {
    parser.setCachable();
    parser.push('HMGET');
    parser.pushKey(key);
    parser.pushVariadic(fields);
  },
  transformArguments(key: RedisArgument, fields: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
