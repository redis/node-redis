import { BlobStringReply, Command, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument, MGetReply2, MGetRawReply2, MGetReply3, MGetRawReplyValue3, MGetRawReply3, parseResp3Mget } from './MGET';
import { Labels, pushWithLabelsArgument, resp3MapToValue, transformLablesReply2, transformLablesReply3, transformSampleReply } from '.';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export interface MGetWithLabelsReply2 extends MGetReply2 {
  labels: Labels;
};

export interface MGetWithLabelsReply3 extends MGetReply3 {
  labels: Labels;
};

function parseResp3MgetWithLabels(
  key: BlobStringReply | string,
  value: UnwrapReply<MGetRawReplyValue3>
): MGetWithLabelsReply3 {
  const ret = parseResp3Mget(key, value) as MGetWithLabelsReply3;
  ret.labels = transformLablesReply3(value[0]);

  return ret;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetWithLabelsOptions) {
    let args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
    return pushFilterArgument(args, filter);
  },
  transformReply: {
    2(reply: UnwrapReply<MGetRawReply2>): Array<MGetWithLabelsReply2> {
      return reply.map(([key, labels, sample]) => ({
          key: key,
          labels: transformLablesReply2(labels),
          sample: transformSampleReply[2](sample)
      }));
    },
    3(reply: UnwrapReply<MGetRawReply3>): Array<MGetReply3> {
      return resp3MapToValue(reply, parseResp3MgetWithLabels)
    }
  },
} as const satisfies Command;
