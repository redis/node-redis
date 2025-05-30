
import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { ZKeys } from './generic-transformers';
import { parseZInterArguments, ZInterOptions } from './ZINTER';

export default {
  IS_READ_ONLY: false,
  /**
   * Stores the result of intersection of multiple sorted sets in a new sorted set.
   * @param parser - The Redis command parser.
   * @param destination - Destination key where the result will be stored.
   * @param keys - Keys of the sorted sets to intersect.
   * @param options - Optional parameters for the intersection operation.
   */
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZInterOptions
  ) {
    parser.push('ZINTERSTORE');
    parser.pushKey(destination);
    parseZInterArguments(parser, keys, options);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
