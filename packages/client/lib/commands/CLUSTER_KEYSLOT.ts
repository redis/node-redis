import { Command, NumberReply, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.pushVariadic(['CLUSTER', 'KEYSLOT', key]);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
