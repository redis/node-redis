import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import {
  transformTimestampArgument,
  parseRetentionArgument,
  TimeSeriesEncoding,
  parseEncodingArgument,
  parseChunkSizeArgument,
  TimeSeriesDuplicatePolicies,
  Labels,
  parseLabelsArgument,
  Timestamp,
  parseIgnoreArgument
} from './helpers';

export interface TsIgnoreOptions {
  maxTimeDiff: number;
  maxValDiff: number;
}

export interface TsAddOptions {
  RETENTION?: number;
  ENCODING?: TimeSeriesEncoding;
  CHUNK_SIZE?: number;
  ON_DUPLICATE?: TimeSeriesDuplicatePolicies;
  LABELS?: Labels;
  IGNORE?: TsIgnoreOptions;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Creates or appends a sample to a time series
   * @param parser - The command parser
   * @param key - The key name for the time series
   * @param timestamp - The timestamp of the sample
   * @param value - The value of the sample
   * @param options - Optional configuration parameters
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    timestamp: Timestamp,
    value: number,
    options?: TsAddOptions
  ) {
    parser.push('TS.ADD');
    parser.pushKey(key);
    parser.push(transformTimestampArgument(timestamp), value.toString());

    parseRetentionArgument(parser, options?.RETENTION);

    parseEncodingArgument(parser, options?.ENCODING);

    parseChunkSizeArgument(parser, options?.CHUNK_SIZE);

    if (options?.ON_DUPLICATE) {
      parser.push('ON_DUPLICATE', options.ON_DUPLICATE);
    }

    parseLabelsArgument(parser, options?.LABELS);

    parseIgnoreArgument(parser, options?.IGNORE);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
