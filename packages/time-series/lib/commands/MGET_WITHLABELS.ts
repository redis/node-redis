import { Command, TypeMapping, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument, MGetReply2, MGetRawReply2, MGetReply3, MGetRawReplyValue3, MGetRawReply3, parseResp3Mget, parseResp2Mget, MGetRawReplyValue2 } from './MGET';
import { Labels, pushWithLabelsArgument, resp2MapToValue, resp3MapToValue, transformLablesReply2, transformLablesReply3 } from '.';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export interface MGetWithLabelsReply2 extends MGetReply2 {
  labels: Labels;
};

export interface MGetWithLabelsReply3 extends MGetReply3 {
  labels: Labels;
};

function parseResp2MgetWithLabels(
  value: UnwrapReply<MGetRawReplyValue2>,
): MGetWithLabelsReply3 {
  const ret = parseResp2Mget(value) as unknown as MGetWithLabelsReply3;
  ret.labels = transformLablesReply2(value[1]);

  return ret;
}

function parseResp3MgetWithLabels(value: UnwrapReply<MGetRawReplyValue3>): MGetWithLabelsReply3 {
  const ret = parseResp3Mget(value) as MGetWithLabelsReply3;
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
    2(reply: UnwrapReply<MGetRawReply2>, preserve?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, parseResp2MgetWithLabels, typeMapping);
    },
    3(reply: UnwrapReply<MGetRawReply3>) {
      return resp3MapToValue(reply, parseResp3MgetWithLabels);
    }
  },
} as const satisfies Command;
