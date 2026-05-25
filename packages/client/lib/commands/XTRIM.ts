import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { StreamDeletionPolicy } from './common-stream.types';

/**
 * Options for the XTRIM command
 * 
 * @property strategyModifier - Exact ('=') or approximate ('~') trimming
 * @property LIMIT - Maximum number of entries to trim in one call (Redis 6.2+)
 * @property policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
 */
export interface XTrimOptions {
  strategyModifier?: '=' | '~';
  /** added in 6.2 */
  LIMIT?: number;
  /** added in 8.2 */
  policy?: StreamDeletionPolicy;
}

/**
 * Command for trimming a stream to a specified length or minimum ID
 */
export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    strategy: 'MAXLEN' | 'MINID',
    threshold: number | string,
    options?: XTrimOptions
  ) {
    parser.push('XTRIM')
    parser.pushKey(key);
    parser.push(strategy);

    if (options?.strategyModifier) {
      parser.push(options.strategyModifier);
    }

    parser.push(threshold.toString());

    if (options?.LIMIT) {
      parser.push('LIMIT', options.LIMIT.toString());
    }

    if (options?.policy) {
      parser.push(options.policy);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
