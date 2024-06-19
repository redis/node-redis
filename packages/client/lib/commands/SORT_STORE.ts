import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import SORT, { SortOptions } from './SORT';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, options?: SortOptions) {
    SORT.parseCommand(parser, source, options);
    parser.pushVariadic(['STORE', destination]);
  },
  transformArguments(source: RedisArgument, destination: RedisArgument, options?: SortOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
