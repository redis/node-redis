import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument, transformSortedSetReply } from './generic-transformers';
import ZDIFF from './ZDIFF';


export default {
  IS_READ_ONLY: ZDIFF.IS_READ_ONLY,
  /**
   * Returns the difference between the first sorted set and all successive sorted sets with their scores.
   * @param parser - The Redis command parser.
   * @param keys - Keys of the sorted sets.
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    ZDIFF.parseCommand(parser, keys);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
