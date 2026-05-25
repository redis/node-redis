import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number,
    stop: number
  ) {      
    parser.push('ZREMRANGEBYRANK');
    parser.pushKey(key);
    parser.push(
      start.toString(), 
      stop.toString()
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
