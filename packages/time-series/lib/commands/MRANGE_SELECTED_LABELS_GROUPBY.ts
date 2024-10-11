import { Command, ArrayReply, BlobStringReply, MapReply, TuplesReply, RedisArgument, NullReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { pushSelectedLabelsArguments, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, pushRangeArguments } from './RANGE';
import { extractResp3MRangeSources, pushGroupByArguments, TsMRangeGroupBy, TsMRangeGroupByRawMetadataReply3 } from './MRANGE_GROUPBY';
import { pushFilterArgument } from './MGET';
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
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    selectedLabels: RedisVariadicArgument,
    filter: RedisVariadicArgument,
    groupBy: TsMRangeGroupBy,
    options?: TsRangeOptions
  ) => {
    let args = pushRangeArguments(
      [command],
      fromTimestamp,
      toTimestamp,
      options
    );
  
    args = pushSelectedLabelsArguments(args, selectedLabels);
  
    args = pushFilterArgument(args, filter);
  
    pushGroupByArguments(args, groupBy);
  
    return args;
  };
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: createMRangeSelectedLabelsGroupByTransformArguments('TS.MRANGE'),
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
