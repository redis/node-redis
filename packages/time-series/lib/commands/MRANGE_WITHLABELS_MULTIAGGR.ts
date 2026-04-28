import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, UnwrapReply, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/dist/lib/RESP/types';
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

export type TsMRangeWithLabelsMultiRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply
    ]>>,
    samples: ArrayReply<Resp2Reply<MultiAggregationSampleRawReply>>
  ]>
>;

export type TsMRangeWithLabelsMultiRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply>,
    metadata: never, // ?!
    samples: ArrayReply<MultiAggregationSampleRawReply>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands with labels and multiple aggregators
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createTransformMRangeWithLabelsMultiArguments(command: RedisArgument) {
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

    parser.push('WITHLABELS');

    parseFilterArgument(parser, filter);
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeWithLabelsMultiArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeWithLabelsMultiRawReply2, _?: unknown, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, labels, samples]) => {
        const unwrappedLabels = labels as unknown as UnwrapReply<typeof labels>;
        // TODO: use Map type mapping for labels
        const labelsObject: Record<string, BlobStringReply> = Object.create(null);
        for (const tuple of unwrappedLabels) {
          const [key, value] = tuple as unknown as UnwrapReply<typeof tuple>;
          const unwrappedKey = key as unknown as UnwrapReply<typeof key>;
          labelsObject[unwrappedKey.toString()] = value;
        }

        return {
          labels: labelsObject,
          samples: transformMultiAggregationSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeWithLabelsMultiRawReply3) {
      return resp3MapToValue(reply, ([labels, _metadata, samples]) => {
        return {
          labels,
          samples: transformMultiAggregationSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
