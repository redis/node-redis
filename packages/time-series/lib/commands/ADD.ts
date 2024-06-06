import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import {
  transformTimestampArgument,
  pushRetentionArgument,
  TimeSeriesEncoding,
  pushEncodingArgument,
  pushChunkSizeArgument,
  TimeSeriesDuplicatePolicies,
  Labels,
  pushLabelsArgument,
  Timestamp,
  pushIgnoreArgument
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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    timestamp: Timestamp,
    value: number,
    options?: TsAddOptions
  ) {
    const args = [
      'TS.ADD',
      key,
      transformTimestampArgument(timestamp),
      value.toString()
    ];

    pushRetentionArgument(args, options?.RETENTION);

    pushEncodingArgument(args, options?.ENCODING);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    if (options?.ON_DUPLICATE) {
      args.push('ON_DUPLICATE', options.ON_DUPLICATE);
    }

    pushLabelsArgument(args, options?.LABELS);

    pushIgnoreArgument(args, options?.IGNORE);

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
