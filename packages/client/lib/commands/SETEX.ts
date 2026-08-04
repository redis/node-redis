import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, seconds: number, value: RedisArgument) {
    parser.push('SETEX');
    parser.pushKey(key);
    parser.push(seconds.toString(), value);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
