import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SUNION command to return the members of the set resulting from the union of all the given sets
   *
   * @param parser - The command parser
   * @param keys - One or more set keys to compute the union from
   * @returns Array of all elements that are members of at least one of the given sets
   * @see https://redis.io/commands/sunion/
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('SUNION');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
