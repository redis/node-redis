import { CommandArguments, Command, BlobStringReply, ArrayReply, UnwrapReply, Resp2Reply, MapReply, TuplesReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { RawLabels2, RawLabels3, resp3MapToValue, SampleRawReply, transformSampleReply } from '.';

export interface TsMGetOptions {
  LATEST?: boolean;
}

export function pushLatestArgument(args: CommandArguments, latest?: boolean) {
  if (latest) {
    args.push('LATEST');
  }

  return args;
}

export function pushFilterArgument(args: CommandArguments, filter: RedisVariadicArgument) {
  args.push('FILTER');
  return pushVariadicArguments(args, filter);
}

export type MGetRawReply2 = ArrayReply<[
  key: BlobStringReply,
  labels: RawLabels2,
  sample: Resp2Reply<SampleRawReply>
]>;

export type MGetRawReplyValue3 = TuplesReply<[
  labels: RawLabels3,
  sample: SampleRawReply
]>;

export type MGetRawReply3 = MapReply<
  BlobStringReply,
  MGetRawReplyValue3
>

export interface MGetReply2 {
  key: BlobStringReply;
  sample: ReturnType<typeof transformSampleReply[2]>;
}

export interface MGetReply3 {
  key: BlobStringReply | string
  sample: ReturnType<typeof transformSampleReply[3]>;
}

export function parseResp3Mget(
  key: BlobStringReply | string,
  value: UnwrapReply<MGetRawReplyValue3>
): MGetReply3 {

  return {
    key: key,
    sample: transformSampleReply[3](value[1])
  }
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetOptions) {
    const args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    return pushFilterArgument(args, filter);
  },
  transformReply: {
    2(reply: UnwrapReply<MGetRawReply2>): Array<MGetReply2> {
      return reply.map(([key, _, sample]) => ({
        key: key,
        sample: transformSampleReply[2](sample)
      }));
    },
    3(reply: UnwrapReply<MGetRawReply3>): Array<MGetReply3> {
      return resp3MapToValue(reply, parseResp3Mget)
    }
  }
} as const satisfies Command;
