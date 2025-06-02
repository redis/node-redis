import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from './helpers';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { parseFilterArgument } from './MGET';

export type TsMRangeRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never, // empty array without WITHLABELS or SELECTED_LABELS
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

export type TsMRangeRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never, // empty hash without WITHLABELS or SELECTED_LABELS
    metadata: never, // ?!
    samples: ArrayReply<SampleRawReply>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createTransformMRangeArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filter: RedisVariadicArgument,
    options?: TsRangeOptions
  ) => {
    parser.push(command);
    parseRangeArguments(
      parser,
      fromTimestamp,
      toTimestamp,
      options
    );
  
    parseFilterArgument(parser, filter);
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Gets samples for time series matching a specific filter within a time range
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeRawReply2, _?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, _labels, samples]) => {
        return transformSamplesReply[2](samples);
      }, typeMapping);
    },
    3(reply: TsMRangeRawReply3) {
      return resp3MapToValue(reply, ([_labels, _metadata, samples]) => {
        return transformSamplesReply[3](samples);
      });
    }
  },
} as const satisfies Command;
