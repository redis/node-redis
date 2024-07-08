import { Command, ReplyUnion, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument, MGetReply2, MGetRawReply2 } from './MGET';
import { Labels, SampleRawReply, pushWithLabelsArgument, transformLablesReply, transformSampleReply } from '.';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export interface MGetWithLabelsReply2 extends MGetReply2 {
  labels: Labels;
};

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetWithLabelsOptions) {
    let args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
    return pushFilterArgument(args, filter);
  },
  transformReply: {
    2: (reply: UnwrapReply<MGetRawReply2>): Array<MGetWithLabelsReply2> => {
      return reply.map(([key, labels, sample]) => ({
          key,
          labels: transformLablesReply(labels),
          sample: transformSampleReply[2](sample as unknown as Resp2Reply<SampleRawReply>)
      }));
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3Module: true
} as const satisfies Command;
