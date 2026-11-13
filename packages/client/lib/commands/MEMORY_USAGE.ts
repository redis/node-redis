import { CommandParser } from '../client/parser';
import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export interface MemoryUsageOptions {
  /**
   * Number of sampled nested values for aggregate types. `0` samples all of
   * them; the default is 5.
   */
  SAMPLES?: number;
}

export default {
  // The server metadata makes MEMORY USAGE look cacheable (readonly + keyed,
  // no tips), but some changes to a key's memory send no invalidation (for
  // example XGROUP CREATE on a stream), so a cached reply would stay stale
  // until the key itself is written.
  CACHEABLE: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: MemoryUsageOptions) {
    parser.push('MEMORY', 'USAGE');
    parser.pushKey(key);

    if (options?.SAMPLES !== undefined) {
      parser.push('SAMPLES', options.SAMPLES.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
