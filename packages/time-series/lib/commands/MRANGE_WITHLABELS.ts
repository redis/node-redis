import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, UnwrapReply, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { parseFilterArgument } from './MGET';

export type TsMRangeWithLabelsRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<TuplesReply<[
      label: BlobStringReply,
      value: BlobStringReply
    ]>>,
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

export type TsMRangeWithLabelsRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, BlobStringReply>,
    metadata: never, // ?!
    samples: ArrayReply<SampleRawReply>
  ]>
>;

export function createTransformMRangeWithLabelsArguments(command: RedisArgument) {
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
  
    parser.push('WITHLABELS');
  
    parseFilterArgument(parser, filter);
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeWithLabelsArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeWithLabelsRawReply2, _?: any, typeMapping?: TypeMapping) {
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
          samples: transformSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeWithLabelsRawReply3) {
      return resp3MapToValue(reply, ([labels, _metadata, samples]) => {
        return {
          labels,
          samples: transformSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
