import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Metrics to track for hotkeys
 */
export const HOTKEYS_METRICS = {
  CPU: 'CPU',
  NET: 'NET'
} as const;

export type HotkeysMetric = typeof HOTKEYS_METRICS[keyof typeof HOTKEYS_METRICS];

/**
 * Options for HOTKEYS START command
 */
export interface HotkeysStartOptions {
  /**
   * Metrics to track. At least one must be specified.
   * CPU: CPU time spent on the key
   * NET: Sum of ingress/egress/replication network bytes used by the key
   */
  METRICS: {
    count: number;
    CPU?: boolean;
    NET?: boolean;
  };
  /**
   * How many keys to report. Default: 10, min: 10, max: 64
   */
  COUNT?: number;
  /**
   * Automatically stop tracking after this many seconds. Default: 0 (no auto-stop)
   */
  DURATION?: number;
  /**
   * Log a key with probability 1/ratio. Default: 1 (track every key), min: 1
   */
  SAMPLE?: number;
  /**
   * Only track keys from specified slots
   */
  SLOTS?: {
    count: number;
    slots: Array<number>;
  };
}

/**
 * HOTKEYS START command - starts hotkeys tracking
 * 
 * State transitions:
 * - EMPTY -> ACTIVE
 * - STOPPED -> ACTIVE (fresh)
 * - ACTIVE -> ERROR
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Starts hotkeys tracking with specified options.
   * @param parser - The Redis command parser
   * @param options - Configuration options for hotkeys tracking
   * @see https://redis.io/commands/hotkeys-start/
   */
  parseCommand(parser: CommandParser, options: HotkeysStartOptions) {
    parser.push('HOTKEYS', 'START');

    // METRICS is required with count and at least one metric type
    parser.push('METRICS', options.METRICS.count.toString());
    if (options.METRICS.CPU) {
      parser.push('CPU');
    }
    if (options.METRICS.NET) {
      parser.push('NET');
    }

    // COUNT option
    if (options.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }

    // DURATION option
    if (options.DURATION !== undefined) {
      parser.push('DURATION', options.DURATION.toString());
    }

    // SAMPLE option
    if (options.SAMPLE !== undefined) {
      parser.push('SAMPLE', options.SAMPLE.toString());
    }

    // SLOTS option
    if (options.SLOTS !== undefined) {
      parser.push('SLOTS', options.SLOTS.count.toString());
      for (const slot of options.SLOTS.slots) {
        parser.push(slot.toString());
      }
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

