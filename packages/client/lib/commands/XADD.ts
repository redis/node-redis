import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { StreamDeletionPolicy } from './common-stream.types';
import { Tail } from './generic-transformers';

/**
 * Options for the XADD command
 *
 * @property policy - Reference tracking policy for the entry (KEEPREF, DELREF, or ACKED) - added in 8.6
 * @property IDMPAUTO - Automatically calculate an idempotent ID based on entry content to prevent duplicate entries - added in 8.6
 * @property IDMPAUTO.pid - Producer ID, must be unique per producer and consistent across restarts
 * @property IDMP - Use a specific idempotent ID to prevent duplicate entries - added in 8.6
 * @property IDMP.pid - Producer ID, must be unique per producer and consistent across restarts
 * @property IDMP.iid - Idempotent ID (binary string), must be unique per message and per pid
 * @property TRIM - Optional trimming configuration
 * @property TRIM.strategy - Trim strategy: MAXLEN (by length) or MINID (by ID)
 * @property TRIM.strategyModifier - Exact ('=') or approximate ('~') trimming
 * @property TRIM.threshold - Maximum stream length or minimum ID to retain
 * @property TRIM.limit - Maximum number of entries to trim in one call
 * @property TRIM.policy - Policy to apply when trimming entries (optional, defaults to KEEPREF)
 */
export interface XAddOptions {
  /** added in 8.6 */
  policy?: StreamDeletionPolicy;
  /** added in 8.6 */
  IDMPAUTO?: {
    pid: RedisArgument;
  };
  /** added in 8.6 */
  IDMP?: {
    pid: RedisArgument;
    iid: RedisArgument;
  };
  TRIM?: {
    strategy?: 'MAXLEN' | 'MINID';
    strategyModifier?: '=' | '~';
    threshold: number;
    limit?: number;
    /** added in 8.6 */
    policy?: StreamDeletionPolicy;
  };
}

/**
 * Parses arguments for the XADD command
 *
 * @param optional - Optional command modifier (e.g., NOMKSTREAM)
 * @param parser - The command parser
 * @param key - The stream key
 * @param id - Message ID (* for auto-generation)
 * @param message - Key-value pairs representing the message fields
 * @param options - Additional options for reference tracking, idempotency, and trimming
 */
export function parseXAddArguments(
  optional: RedisArgument | undefined,
  parser: CommandParser,
  key: RedisArgument,
  id: RedisArgument,
  message: Record<string, RedisArgument>,
  options?: XAddOptions
) {
  parser.push('XADD');
  parser.pushKey(key);
  if (optional) {
    parser.push(optional);
  }

  // Reference tracking policy (KEEPREF | DELREF | ACKED)
  if (options?.policy) {
    parser.push(options.policy);
  }

  // Idempotency options (IDMPAUTO or IDMP)
  if (options?.IDMPAUTO) {
    parser.push('IDMPAUTO', options.IDMPAUTO.pid);
  } else if (options?.IDMP) {
    parser.push('IDMP', options.IDMP.pid, options.IDMP.iid);
  }

  // Trimming options
  if (options?.TRIM) {
    if (options.TRIM.strategy) {
      parser.push(options.TRIM.strategy);
    }

    if (options.TRIM.strategyModifier) {
      parser.push(options.TRIM.strategyModifier);
    }

    parser.push(options.TRIM.threshold.toString());

    if (options.TRIM.limit) {
      parser.push('LIMIT', options.TRIM.limit.toString());
    }

    if (options.TRIM.policy) {
      parser.push(options.TRIM.policy);
    }
  }

  parser.push(id);

  for (const [key, value] of Object.entries(message)) {
    parser.push(key, value);
  }
}

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XADD command to append a new entry to a stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param id - Message ID (* for auto-generation)
   * @param message - Key-value pairs representing the message fields
   * @param options - Additional options for stream trimming
   * @returns The ID of the added entry
   * @see https://redis.io/commands/xadd/
   */
  parseCommand(...args: Tail<Parameters<typeof parseXAddArguments>>) {
    return parseXAddArguments(undefined, ...args);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
