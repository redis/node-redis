import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { TsCreateOptions } from './CREATE';
import { pushRetentionArgument, pushChunkSizeArgument, pushDuplicatePolicy, pushLabelsArgument, pushIgnoreArgument } from '.';

export type TsAlterOptions = Pick<TsCreateOptions, 'RETENTION' | 'CHUNK_SIZE' | 'DUPLICATE_POLICY' | 'LABELS' | 'IGNORE'>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: TsAlterOptions) {
    const args = ['TS.ALTER', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    pushIgnoreArgument(args, options?.IGNORE);

    return args;
  },
transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
