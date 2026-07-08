import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, Resp2Reply } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, SamplesRawReply, transformSamplesReply } from './helpers';

/**
 * Sentinel cursor values for {@link READ}'s `timestamp` argument.
 *
 * The wire values must remain `-`, `+`, and `$`; only the first call of an
 * iteration should use a sentinel. Every subsequent call should pass
 * `last returned timestamp + 1`.
 */
export const TS_READ_TIMESTAMP = {
  /** `-` — no lower bound, reads from the earliest sample (equivalent to `0`). */
  EARLIEST: '-',
  /** `+` — the latest existing sample's timestamp, inclusive. */
  LATEST: '+',
  /** `$` — the latest sample's timestamp + 1: only samples added after the call qualify. Meaningful only with `BLOCK`. */
  NEW: '$'
} as const;

export type TsReadTimestamp = Timestamp | typeof TS_READ_TIMESTAMP[keyof typeof TS_READ_TIMESTAMP];

export interface TsReadOptions {
  /**
   * Opt into blocking. All-or-nothing: when present, both `milliseconds` and
   * `minCount` are emitted on the wire.
   */
  BLOCK?: {
    /** Maximum wait in milliseconds, non-negative. `0` means wait indefinitely. */
    milliseconds: number;
    /** Unblock threshold, positive integer. Defaults to `1`. */
    minCount?: number;
  };
  /** Reply cap, positive integer. Omitted means unlimited. */
  MAX_COUNT?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    timestamp: TsReadTimestamp,
    options?: TsReadOptions
  ) {
    parser.push('TS.READ');
    parser.pushKey(key);
    parser.push(transformTimestampArgument(timestamp));

    if (options?.BLOCK !== undefined) {
      parser.push(
        'BLOCK',
        options.BLOCK.milliseconds.toString(),
        (options.BLOCK.minCount ?? 1).toString()
      );
    }

    if (options?.MAX_COUNT !== undefined) {
      parser.push('MAX_COUNT', options.MAX_COUNT.toString());
    }
  },
  transformReply: {
    2(reply: Resp2Reply<SamplesRawReply>) {
      return transformSamplesReply[2](reply);
    },
    3(reply: SamplesRawReply) {
      return transformSamplesReply[3](reply);
    }
  }
} as const satisfies Command;
