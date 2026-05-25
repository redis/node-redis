import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import {
  resp2MapToValue,
  resp3MapToValue,
  MultiAggregationSampleRawReply,
  Timestamp,
  transformMultiAggregationSamplesReply
} from './helpers';
import { TsRangeMultiAggrOptions, parseRangeMultiArguments } from './RANGE_MULTIAGGR';
import { parseFilterArgument } from './MGET';

export type TsMRangeMultiRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never, // empty array without WITHLABELS or SELECTED_LABELS
    samples: ArrayReply<Resp2Reply<MultiAggregationSampleRawReply>>
  ]>
>;

export type TsMRangeMultiRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never, // empty hash without WITHLABELS or SELECTED_LABELS
    metadata: never, // ?!
    samples: ArrayReply<MultiAggregationSampleRawReply>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands with multiple aggregators
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createTransformMRangeMultiArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
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

    parseFilterArgument(parser, filter);
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeMultiArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeMultiRawReply2, _?: unknown, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, _labels, samples]) => {
        return transformMultiAggregationSamplesReply[2](samples);
      }, typeMapping);
    },
    3(reply: TsMRangeMultiRawReply3) {
      return resp3MapToValue(reply, ([_labels, _metadata, samples]) => {
        return transformMultiAggregationSamplesReply[3](samples);
      });
    }
  },
} as const satisfies Command;
