import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('CLUSTER', 'KEYSLOT', key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
