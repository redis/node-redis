import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, NullReply, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import {
  parseSelectedLabelsArguments,
  resp2MapToValue,
  resp3MapToValue,
  MultiAggregationSampleRawReply,
  Timestamp,
  transformRESP2Labels,
  transformMultiAggregationSamplesReply
} from './helpers';
import { TsRangeMultiAggrOptions, parseRangeMultiArguments } from './RANGE_MULTIAGGR';
import { parseFilterArgument } from './MGET';

export type TsMRangeSelectedLabelsMultiRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply | NullReply
    ]>>,
    samples: ArrayReply<Resp2Reply<MultiAggregationSampleRawReply>>
  ]>
>;

export type TsMRangeSelectedLabelsMultiRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply | NullReply>,
    metadata: never, // ?!
    samples: ArrayReply<MultiAggregationSampleRawReply>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands with selected labels and multiple aggregators
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createTransformMRangeSelectedLabelsMultiArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    selectedLabels: RedisVariadicArgument,
    filter: RedisVariadicArgument,
    options: TsRangeMultiAggrOptions
  ) => {
    parser.push(command);
    parseRangeMultiArguments(
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeSelectedLabelsMultiArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeSelectedLabelsMultiRawReply2, _?: unknown, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, labels, samples]) => {
        return {
          labels: transformRESP2Labels(labels, typeMapping),
          samples: transformMultiAggregationSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeSelectedLabelsMultiRawReply3) {
      return resp3MapToValue(reply, ([labels, _metadata, samples]) => {
        return {
          labels,
          samples: transformMultiAggregationSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
