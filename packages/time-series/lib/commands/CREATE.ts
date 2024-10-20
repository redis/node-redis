import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
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
} from '.';
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
