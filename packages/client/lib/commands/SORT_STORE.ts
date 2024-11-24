import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import SORT, { SortOptions } from './SORT';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, options?: SortOptions) {
    SORT.parseCommand(parser, source, options);
    parser.push('STORE', destination);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
