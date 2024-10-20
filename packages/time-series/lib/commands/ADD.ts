import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';
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
} from '.';

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
