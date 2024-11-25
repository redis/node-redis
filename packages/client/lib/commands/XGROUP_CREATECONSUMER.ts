import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument
  ) {
    parser.push('XGROUP', 'CREATECONSUMER');
    parser.pushKey(key);
    parser.push(group, consumer);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
