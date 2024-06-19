import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, index: number, element: RedisArgument) {
    parser.push('LSET');
    parser.pushKey(key);
    parser.pushVariadic([index.toString(), element]);
  },
  transformArguments(key: RedisArgument, index: number, element: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
