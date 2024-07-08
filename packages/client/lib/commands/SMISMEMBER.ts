import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, members: Array<RedisArgument>) {
    parser.setCachable();
    parser.push('SMISMEMBER');
    parser.pushKey(key);
    for (const member of members) {
      parser.push(member);
    }
  },
  transformArguments(key: RedisArgument, members: Array<RedisArgument>) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
