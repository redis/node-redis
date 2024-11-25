import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.push('LTRIM');
    parser.pushKey(key);
    parser.push(start.toString(), stop.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
