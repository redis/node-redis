import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { parseFilterArgument } from './MGET';

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
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
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
  
    parseFilterArgument(parser, filter);
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeArguments('TS.MRANGE'),
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
