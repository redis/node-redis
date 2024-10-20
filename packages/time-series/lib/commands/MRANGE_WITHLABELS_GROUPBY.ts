import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformRESP2LabelsWithSources, transformSamplesReply } from '.';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { extractResp3MRangeSources, parseGroupByArguments, TsMRangeGroupBy, TsMRangeGroupByRawMetadataReply3 } from './MRANGE_GROUPBY';
import { parseFilterArgument } from './MGET';

export type TsMRangeWithLabelsGroupByRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply
    ]>>,
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

export type TsMRangeWithLabelsGroupByRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply>,
    metadata: never, // ?!
    metadata2: TsMRangeGroupByRawMetadataReply3,
    samples: ArrayReply<SampleRawReply>
  ]>
>;

export function createMRangeWithLabelsGroupByTransformArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
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
  
    parser.push('WITHLABELS');
  
    parseFilterArgument(parser, filter);
  
    parseGroupByArguments(parser, groupBy);
    };
}

export default {
  IS_READ_ONLY: true,
  parseCommand: createMRangeWithLabelsGroupByTransformArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeWithLabelsGroupByRawReply2, _?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, labels, samples]) => {
        const transformed = transformRESP2LabelsWithSources(labels);
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
