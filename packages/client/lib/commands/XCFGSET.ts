import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

/**
 * Options for the XCFGSET command
 * 
 * @property IDMP_DURATION - How long Redis remembers each iid in seconds (1-300 seconds)
 * @property IDMP_MAXSIZE - Maximum number of iids Redis remembers per pid (1-1,000,000 iids)
 */
export interface XCfgSetOptions {
  /**
   * How long Redis remembers each iid in seconds.
   * - Minimum value: 1 second
   * - Maximum value: 300 seconds
   * - Default: 100 seconds (or value set by stream-idmp-duration config parameter)
   * - Operational guarantee: Redis won't forget an iid for this duration (unless maxsize is reached)
   * - Should accommodate application crash recovery time
   */
  IDMP_DURATION?: number;
  /**
   * Maximum number of iids Redis remembers per pid.
   * - Minimum value: 1 iid
   * - Maximum value: 1,000,000 (1M) iids
   * - Default: 100 iids (or value set by stream-idmp-maxsize config parameter)
   * - Should be set to: mark-delay [in msec] × (messages/msec) + margin
   * - Example: 10K msgs/sec (10 msgs/msec), 80 msec mark-delay → maxsize = 10 × 80 + margin = 1000 iids
   */
  IDMP_MAXSIZE?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Configures the idempotency parameters for a stream's IDMP map.
   * Sets how long Redis remembers each iid and the maximum number of iids to track.
   * This command clears the existing IDMP map (Redis forgets all previously stored iids),
   * but only if the configuration value actually changes.
   *
   * @param parser - The command parser
   * @param key - The name of the stream
   * @param options - Optional idempotency configuration parameters
   * @returns 'OK' on success
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    options?: XCfgSetOptions
  ) {
    parser.push('XCFGSET');
    parser.pushKey(key);

    if (options?.IDMP_DURATION !== undefined) {
      parser.push('IDMP-DURATION', options.IDMP_DURATION.toString());
    }

    if (options?.IDMP_MAXSIZE !== undefined) {
      parser.push('IDMP-MAXSIZE', options.IDMP_MAXSIZE.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

