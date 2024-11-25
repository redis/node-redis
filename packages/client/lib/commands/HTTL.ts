import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument
  ) {
    parser.push('HTTL');
    parser.pushKey(key);
    parser.push('FIELDS');
    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply> | NullReply
} as const satisfies Command;
