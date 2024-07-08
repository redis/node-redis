import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument
  ) {
    parser.pushVariadic(['XGROUP', 'DELCONSUMER']);
    parser.pushKey(key);
    parser.pushVariadic([group, consumer]);
  },
  transformArguments(key: RedisArgument, group: RedisArgument, consumer: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
