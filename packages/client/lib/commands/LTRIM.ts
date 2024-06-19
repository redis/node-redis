import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.push('LTRIM');
    parser.pushKey(key);
    parser.pushVariadic([start.toString(), stop.toString()]);
  },
  transformArguments(key: RedisArgument, start: number, stop: number) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
