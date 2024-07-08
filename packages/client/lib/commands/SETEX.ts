import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, seconds: number, value: RedisArgument) {
    parser.push('SETEX');
    parser.pushKey(key);
    parser.pushVariadic([seconds.toString(), value]);
  },
  transformArguments(key: RedisArgument, seconds: number, value: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
