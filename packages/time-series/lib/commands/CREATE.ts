import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import {
  pushRetentionArgument,
  TimeSeriesEncoding,
  pushEncodingArgument,
  pushChunkSizeArgument,
  TimeSeriesDuplicatePolicies,
  pushDuplicatePolicy,
  Labels,
  pushLabelsArgument
} from '.';

export interface TsCreateOptions {
  RETENTION?: number;
  ENCODING?: TimeSeriesEncoding;
  CHUNK_SIZE?: number;
  DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
  LABELS?: Labels;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: TsCreateOptions) {
    const args = ['TS.CREATE', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushEncodingArgument(args, options?.ENCODING);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
