import { pushRetentionArgument, Labels, pushLabelsArgument, TimeSeriesDuplicatePolicies, pushChunkSizeArgument, pushDuplicatePolicy } from '.';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TsAlterOptions {
  RETENTION?: number;
  CHUNK_SIZE?: number;
  DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
  LABELS?: Labels;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: TsAlterOptions) {
    const args = ['TS.ALTER', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    return args;
  },
transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
