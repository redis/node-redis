import { CommandArguments, Command, BlobStringReply, ArrayReply, UnwrapReply, Resp2Reply, MapReply, TuplesReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { RawLabels2, RawLabels3, resp2MapToValue, resp3MapToValue, SampleRawReply, transformSampleReply } from '.';

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

export type MGetRawReplyValue2 = TuplesReply<[
  key: BlobStringReply,
  labels: RawLabels2,
  sample: Resp2Reply<SampleRawReply>
]>

export type MGetRawReply2 = ArrayReply<MGetRawReplyValue2>;

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

export function parseResp3Mget(value: UnwrapReply<MGetRawReplyValue3>) {
  return {
    sample: transformSampleReply[3](value[1])
  };
}

export function parseResp2Mget(value: UnwrapReply<MGetRawReplyValue2>) {
  return {
    sample: transformSampleReply[2](value[2])
  };
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetOptions) {
    const args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    return pushFilterArgument(args, filter);
  },
  transformReply: {
    2(reply: UnwrapReply<MGetRawReply2>) {
      return resp2MapToValue(reply, parseResp2Mget);
    },
    3(reply: UnwrapReply<MGetRawReply3>) {
      return resp3MapToValue(reply, parseResp3Mget)
    }
  }
} as const satisfies Command;
