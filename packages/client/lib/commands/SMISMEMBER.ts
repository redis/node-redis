import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, members: Array<RedisArgument>) {
    parser.push('SMISMEMBER');
    parser.pushKey(key);
    parser.pushVariadic(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
