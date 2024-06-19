import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import LCS from './LCS';

export default {
  FIRST_KEY_INDEX: LCS.FIRST_KEY_INDEX,
  IS_READ_ONLY: LCS.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key1: RedisArgument,
    key2: RedisArgument
  ) {
    LCS.parseCommand(parser, key1, key2);
    parser.push('LEN');
  },

  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
