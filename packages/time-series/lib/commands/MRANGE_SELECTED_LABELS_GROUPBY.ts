import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, MapReply, TuplesReply, RedisArgument, NullReply, Resp2Reply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { parseSelectedLabelsArguments, resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformRESP2LabelsWithSources, transformSamplesReply } from './helpers';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { extractResp3MRangeSources, parseGroupByArguments, TsMRangeGroupBy, TsMRangeGroupByRawMetadataReply3 } from './MRANGE_GROUPBY';
import { parseFilterArgument } from './MGET';

export type TsMRangeWithLabelsGroupByRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply | NullReply>,
    metadata: never, // ?!
    metadata2: TsMRangeGroupByRawMetadataReply3,
    samples: ArrayReply<SampleRawReply>
  ]>
>;

export type TsMRangeSelectedLabelsGroupByRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply | NullReply
    ]>>,
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

/**
 * Creates a function that parses arguments for multi-range commands with selected labels and grouping
 * @param command - The command name to use (TS.MRANGE or TS.MREVRANGE)
 */
export function createMRangeSelectedLabelsGroupByTransformArguments(
  command: RedisArgument
) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    selectedLabels: RedisVariadicArgument,
    filter: RedisVariadicArgument,
    groupBy: TsMRangeGroupBy,
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
  
    parseGroupByArguments(parser, groupBy);
  };
}

export default {
  parseCommand: createMRangeSelectedLabelsGroupByTransformArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeSelectedLabelsGroupByRawReply2, _?: unknown, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, labels, samples]) => {
        const transformed = transformRESP2LabelsWithSources(labels, typeMapping);
        return {
          labels: transformed.labels,
          sources: transformed.sources,
          samples: transformSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeWithLabelsGroupByRawReply3) {
      return resp3MapToValue(reply, ([labels, _metadata, metadata2, samples]) => {
        return {
          labels,
          sources: extractResp3MRangeSources(metadata2),
          samples: transformSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
