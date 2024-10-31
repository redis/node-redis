import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';
import { Timestamp, transformTimestampArgument, parseRetentionArgument, parseChunkSizeArgument, Labels, parseLabelsArgument, parseIgnoreArgument } from '.';
import { TsIgnoreOptions } from './ADD';

export interface TsIncrByOptions {
  TIMESTAMP?: Timestamp;
  RETENTION?: number;
  UNCOMPRESSED?: boolean;
  CHUNK_SIZE?: number;
  LABELS?: Labels;
  IGNORE?: TsIgnoreOptions;
}

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
  parseCommand(...args: Parameters<typeof parseIncrByArguments>) {
    const parser = args[0];

    parser.push('TS.INCRBY');
    parseIncrByArguments(...args);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
