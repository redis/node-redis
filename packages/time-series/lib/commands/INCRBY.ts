import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, parseRetentionArgument, parseChunkSizeArgument, Labels, parseLabelsArgument, parseIgnoreArgument } from './helpers';
import { TsIgnoreOptions } from './ADD';

export interface TsIncrByOptions {
  TIMESTAMP?: Timestamp;
  RETENTION?: number;
  UNCOMPRESSED?: boolean;
  CHUNK_SIZE?: number;
  LABELS?: Labels;
  IGNORE?: TsIgnoreOptions;
}

/**
 * Parses arguments for incrementing a time series value
 * @param parser - The command parser
 * @param key - The key name of the time series
 * @param value - The value to increment by
 * @param options - Optional parameters for the command
 */
export function parseIncrByArguments(
  parser: CommandParser,
  key: RedisArgument,
  value: number,
  options?: TsIncrByOptions
) {
  parser.pushKey(key);
  parser.push(value.toString());

  if (options?.TIMESTAMP !== undefined && options?.TIMESTAMP !== null) {
    parser.push('TIMESTAMP', transformTimestampArgument(options.TIMESTAMP));
  }

  parseRetentionArgument(parser, options?.RETENTION);

  if (options?.UNCOMPRESSED) {
    parser.push('UNCOMPRESSED');
  }

  parseChunkSizeArgument(parser, options?.CHUNK_SIZE);

  parseLabelsArgument(parser, options?.LABELS);

  parseIgnoreArgument(parser, options?.IGNORE);
}

export default {
  IS_READ_ONLY: false,
  /**
   * Increases the value of a time series by a given amount
   * @param args - Arguments passed to the {@link parseIncrByArguments} function
   */
  parseCommand(...args: Parameters<typeof parseIncrByArguments>) {
    const parser = args[0];

    parser.push('TS.INCRBY');
    parseIncrByArguments(...args);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
