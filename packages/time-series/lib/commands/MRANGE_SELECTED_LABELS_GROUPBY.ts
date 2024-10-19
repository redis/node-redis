import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, MapReply, TuplesReply, RedisArgument, NullReply } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { parseSelectedLabelsArguments, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { extractResp3MRangeSources, parseGroupByArguments, TsMRangeGroupBy, TsMRangeGroupByRawMetadataReply3 } from './MRANGE_GROUPBY';
import { parseFilterArgument } from './MGET';
import MRANGE_SELECTED_LABELS from './MRANGE_SELECTED_LABELS';

export type TsMRangeWithLabelsGroupByRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply | NullReply>,
    metadata: never, // ?!
    metadata2: TsMRangeGroupByRawMetadataReply3,
    samples: ArrayReply<SampleRawReply>
  ]>
>;

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
  IS_READ_ONLY: true,
  parseCommand: createMRangeSelectedLabelsGroupByTransformArguments('TS.MRANGE'),
  transformReply: {
    2: MRANGE_SELECTED_LABELS.transformReply[2],
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
