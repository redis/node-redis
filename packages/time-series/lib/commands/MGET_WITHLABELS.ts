import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, BlobStringReply, ArrayReply, Resp2Reply, MapReply, TuplesReply, TypeMapping } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { TsMGetOptions, parseLatestArgument, parseFilterArgument } from './MGET';
import { RawLabelValue, resp2MapToValue, resp3MapToValue, SampleRawReply, transformRESP2Labels, transformSampleReply } from '.';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export type MGetLabelsRawReply2<T extends RawLabelValue> = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: ArrayReply<
      TuplesReply<[
        label: BlobStringReply,
        value: T
      ]>
    >,
    sample: Resp2Reply<SampleRawReply>
  ]>
>;

export type MGetLabelsRawReply3<T extends RawLabelValue> = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: MapReply<BlobStringReply, T>,
    sample: SampleRawReply
  ]>
>;

export function createTransformMGetLabelsReply<T extends RawLabelValue>() {
  return {
    2(reply: MGetLabelsRawReply2<T>, _, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([, labels, sample]) => {
        return {
          labels: transformRESP2Labels(labels),
          sample: transformSampleReply[2](sample)
        };
      }, typeMapping);
    },
    3(reply: MGetLabelsRawReply3<T>) {
      return resp3MapToValue(reply, ([labels, sample]) => {
        return {
          labels,
          sample: transformSampleReply[3](sample)
        };
      });
    }
  } satisfies Command['transformReply'];
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument, options?: TsMGetWithLabelsOptions) {
    parser.push('TS.MGET');
    parseLatestArgument(parser, options?.LATEST);
    parser.push('WITHLABELS');
    parseFilterArgument(parser, filter);
  },
  transformReply: createTransformMGetLabelsReply<BlobStringReply>(),
} as const satisfies Command;
