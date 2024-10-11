import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, pushRangeArguments } from './RANGE';
import { pushFilterArgument } from './MGET';

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

export function createTransformMRangeArguments(command: RedisArgument) {
  return (
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filter: RedisVariadicArgument,
    options?: TsRangeOptions
  ) => {
    const args = pushRangeArguments(
      [command],
      fromTimestamp,
      toTimestamp,
      options
    );
  
    return pushFilterArgument(args, filter);
  };
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: createTransformMRangeArguments('TS.MRANGE'),
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
