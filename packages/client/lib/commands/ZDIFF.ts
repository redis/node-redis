import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the difference between the first sorted set and all the successive sorted sets.
   * @param parser - The Redis command parser.
   * @param keys - Keys of the sorted sets.
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('ZDIFF');
    parser.pushKeysLength(keys);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
