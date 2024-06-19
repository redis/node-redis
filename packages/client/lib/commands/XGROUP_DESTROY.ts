import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.pushVariadic(['XGROUP', 'DESTROY']);
    parser.pushKey(key);
    parser.push(group);
  },
  transformArguments(key: RedisArgument, group: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
