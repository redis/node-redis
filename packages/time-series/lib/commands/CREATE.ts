import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import {
  parseRetentionArgument,
  TimeSeriesEncoding,
  parseEncodingArgument,
  parseChunkSizeArgument,
  TimeSeriesDuplicatePolicies,
  parseDuplicatePolicy,
  Labels,
  parseLabelsArgument,
  parseIgnoreArgument
} from './helpers';
import { TsIgnoreOptions } from './ADD';

export interface TsCreateOptions {
  RETENTION?: number;
  ENCODING?: TimeSeriesEncoding;
  CHUNK_SIZE?: number;
  DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
  LABELS?: Labels;
  IGNORE?: TsIgnoreOptions;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Creates a new time series
   * @param parser - The command parser
   * @param key - The key name for the new time series
   * @param options - Optional configuration parameters
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: TsCreateOptions) {
    parser.push('TS.CREATE');
    parser.pushKey(key);

    parseRetentionArgument(parser, options?.RETENTION);

    parseEncodingArgument(parser, options?.ENCODING);

    parseChunkSizeArgument(parser, options?.CHUNK_SIZE);

    parseDuplicatePolicy(parser, options?.DUPLICATE_POLICY);

    parseLabelsArgument(parser, options?.LABELS);

    parseIgnoreArgument(parser, options?.IGNORE);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
