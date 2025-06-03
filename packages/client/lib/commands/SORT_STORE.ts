import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import SORT, { SortOptions } from './SORT';

export default {
  IS_READ_ONLY: false,
  /**
   * Sorts the elements in a list, set or sorted set and stores the result in a new list.
   * @param parser - The Redis command parser.
   * @param source - Key of the source list, set or sorted set.
   * @param destination - Destination key where the result will be stored.
   * @param options - Optional sorting parameters.
   */
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, options?: SortOptions) {
    SORT.parseCommand(parser, source, options);
    parser.push('STORE', destination);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
