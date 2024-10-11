import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, NullReply, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { pushSelectedLabelsArguments, resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformRESP2Labels, transformSamplesReply } from '.';
import { TsRangeOptions, pushRangeArguments } from './RANGE';
import { pushFilterArgument } from './MGET';

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

export function createTransformMRangeSelectedLabelsArguments(command: RedisArgument) {
  return (
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    selectedLabels: RedisVariadicArgument,
    filter: RedisVariadicArgument,
    options?: TsRangeOptions
  ) => {
    let args = pushRangeArguments(
      [command],
      fromTimestamp,
      toTimestamp,
      options
    );
  
    args = pushSelectedLabelsArguments(args, selectedLabels);
  
    return pushFilterArgument(args, filter);
  };
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: createTransformMRangeSelectedLabelsArguments('TS.MRANGE'),
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
