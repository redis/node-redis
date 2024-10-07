import { CommandArguments, Command, BlobStringReply, ArrayReply, Resp2Reply, MapReply, TuplesReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, transformSampleReply } from '.';

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

export type MGetRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never,
    sample: Resp2Reply<SampleRawReply>
  ]>
>;

export type MGetRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never,
    sample: SampleRawReply
  ]>
>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetOptions) {
    const args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    return pushFilterArgument(args, filter);
  },
  transformReply: {
    2(reply: MGetRawReply2, _, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([,, sample]) => {
        return {
          sample: transformSampleReply[2](sample)
        };
      }, typeMapping);
    },
    3(reply: MGetRawReply3) {
      return resp3MapToValue(reply, ([, sample]) => {
        return {
          sample: transformSampleReply[3](sample)
        };
      });
    }
  }
} as const satisfies Command;
