import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { StreamDeletionPolicy } from './common-stream.types';

/**
 * Options for exact XTRIM trimming
 *
 * @property strategyModifier - Exact ('=') trimming
 * @property policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
 */
export interface XTrimExactOptions {
  strategyModifier?: '=';
  /** added in 8.2 */
  policy?: StreamDeletionPolicy;
}

/**
 * Options for approximate XTRIM trimming
 *
 * @property strategyModifier - Approximate ('~') trimming, required for LIMIT
 * @property LIMIT - Maximum number of entries to trim in one call (Redis 6.2+)
 * @property policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
 */
export interface XTrimApproximateOptions {
  strategyModifier: '~';
  /** added in 6.2 */
  LIMIT?: number;
  /** added in 8.2 */
  policy?: StreamDeletionPolicy;
}

export type XTrimOptions = XTrimExactOptions | XTrimApproximateOptions;

/**
 * Command for trimming a stream to a specified length or minimum ID
 */
export default {
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

    if (options?.strategyModifier !== undefined) {
      parser.push(options.strategyModifier);
    }

    parser.push(threshold.toString());

    if (options?.strategyModifier === '~' && options.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }

    if (options?.policy) {
      parser.push(options.policy);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
