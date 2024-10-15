import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBY');
    parser.pushKey(key);
    parser.push(field, increment.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
