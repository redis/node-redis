import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, fields: RedisVariadicArgument) {
    parser.push('HGETDEL');
    parser.pushKey(key);
    parser.push('FIELDS')
    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
