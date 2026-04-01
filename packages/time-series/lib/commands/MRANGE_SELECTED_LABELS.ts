import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, NullReply, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { parseSelectedLabelsArguments, resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformRESP2Labels, transformSamplesReply } from './helpers';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { parseFilterArgument } from './MGET';

export type TsMRangeSelectedLabelsRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply | NullReply
    ]>>,
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

export type TsMRangeSelectedLabelsRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply | NullReply>,
    metadata: never, // ?!
    samples: ArrayReply<SampleRawReply>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands with selected labels
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createTransformMRangeSelectedLabelsArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    selectedLabels: RedisVariadicArgument,
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
  
    parseSelectedLabelsArguments(parser, selectedLabels);
  
    parseFilterArgument(parser, filter);
  };
}

export default {
  IS_READ_ONLY: true,
  /**
   * Gets samples for time series matching a filter with selected labels
   * @param parser - The command parser
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  parseCommand: createTransformMRangeSelectedLabelsArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeSelectedLabelsRawReply2, _?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, labels, samples]) => {
        return {
          labels: transformRESP2Labels(labels, typeMapping),
          samples: transformSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeSelectedLabelsRawReply3) {
      return resp3MapToValue(reply, ([_key, labels, samples]) => {
        return {
          labels,
          samples: transformSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
