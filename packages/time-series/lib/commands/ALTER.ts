import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { TsCreateOptions } from './CREATE';
import { parseRetentionArgument, parseChunkSizeArgument, parseDuplicatePolicy, parseLabelsArgument, parseIgnoreArgument } from './helpers';


export type TsAlterOptions = Pick<TsCreateOptions, 'RETENTION' | 'CHUNK_SIZE' | 'DUPLICATE_POLICY' | 'LABELS' | 'IGNORE'>;

export default {
  IS_READ_ONLY: false,
  /**
   * Alters the configuration of an existing time series
   * @param parser - The command parser
   * @param key - The key name for the time series
   * @param options - Configuration parameters to alter
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: TsAlterOptions) {
    parser.push('TS.ALTER');
    parser.pushKey(key);

    parseRetentionArgument(parser, options?.RETENTION);

    parseChunkSizeArgument(parser, options?.CHUNK_SIZE);

    parseDuplicatePolicy(parser, options?.DUPLICATE_POLICY);

    parseLabelsArgument(parser, options?.LABELS);

    parseIgnoreArgument(parser, options?.IGNORE);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
