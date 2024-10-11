import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, pushRetentionArgument, pushChunkSizeArgument, Labels, pushLabelsArgument, pushIgnoreArgument } from '.';
import { TsIgnoreOptions } from './ADD';

export interface TsIncrByOptions {
  TIMESTAMP?: Timestamp;
  RETENTION?: number;
  UNCOMPRESSED?: boolean;
  CHUNK_SIZE?: number;
  LABELS?: Labels;
  IGNORE?: TsIgnoreOptions;
}

export function transformIncrByArguments(
  command: RedisArgument,
  key: RedisArgument,
  value: number,
  options?: TsIncrByOptions
) {
  const args = [
    command,
    key,
    value.toString()
  ];

  if (options?.TIMESTAMP !== undefined && options?.TIMESTAMP !== null) {
    args.push('TIMESTAMP', transformTimestampArgument(options.TIMESTAMP));
  }

  pushRetentionArgument(args, options?.RETENTION);

  if (options?.UNCOMPRESSED) {
    args.push('UNCOMPRESSED');
  }

  pushChunkSizeArgument(args, options?.CHUNK_SIZE);

  pushLabelsArgument(args, options?.LABELS);

  pushIgnoreArgument(args, options?.IGNORE);

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments: transformIncrByArguments.bind(undefined, 'TS.INCRBY'),
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
