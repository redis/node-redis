import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, BlobStringReply, ArrayReply, Resp2Reply, MapReply, TuplesReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, transformSampleReply } from './helpers';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface TsMGetOptions {
  LATEST?: boolean;
}

/**
 * Adds LATEST argument to command if specified
 * @param parser - The command parser
 * @param latest - Whether to include the LATEST argument
 */
export function parseLatestArgument(parser: CommandParser, latest?: boolean) {
  if (latest) {
    parser.push('LATEST');
  }
}

/**
 * Adds FILTER argument to command
 * @param parser - The command parser
 * @param filter - Filter to match time series keys
 */
export function parseFilterArgument(parser: CommandParser, filter: RedisVariadicArgument) {
  parser.push('FILTER');
  parser.pushVariadic(filter);
}

export type MGetRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never,
    sample: Resp2Reply<SampleRawReply>
  ]>
>;

export type MGetRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never,
    sample: SampleRawReply
  ]>
>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Gets the last samples matching a specific filter from multiple time series
   * @param parser - The command parser
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument, options?: TsMGetOptions) {
    parser.push('TS.MGET');
    parseLatestArgument(parser, options?.LATEST);
    parseFilterArgument(parser, filter);
  },
  transformReply: {
    2(reply: MGetRawReply2, _, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([,, sample]) => {
        return {
          sample: transformSampleReply[2](sample)
        };
      }, typeMapping);
    },
    3(reply: MGetRawReply3) {
      return resp3MapToValue(reply, ([, sample]) => {
        return {
          sample: transformSampleReply[3](sample)
        };
      });
    }
  }
} as const satisfies Command;
