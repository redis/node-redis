import { RedisArgument, Command, UnwrapReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { MRangeRawReply2, MRangeRawReply3, MRangeReplyItem2, MRangeReplyItem3, MrangeRawReplyValue2, MrangeRawReplyValue3, MrangeRawReplyValueGrouped3, TsMRangeOptions, parseResp2Mrange, parseResp3Mrange, pushGroupByArgument } from './MRANGE';
import { Labels, Timestamp, pushWithLabelsArgument, resp2MapToValue, resp3MapToValue, transformLablesReply2, transformLablesReply3 } from '.';
import { pushFilterArgument } from './MGET';
import { pushRangeArguments } from './RANGE';

export interface TsMRangeWithLabelsOptions extends TsMRangeOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export function transformMRangeWithLabelsArguments(
  command: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  filter: RedisVariadicArgument,
  options?: TsMRangeWithLabelsOptions
) {
  let args = pushRangeArguments([command], fromTimestamp, toTimestamp, options);
  args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
  args = pushFilterArgument(args, filter);
  return pushGroupByArgument(args, options?.GROUPBY);
}

export interface MRangeWithLabelsReplyItem2 extends MRangeReplyItem2 {
  labels: Labels;
}

export interface MRangeWithLabelsReplyItem3 extends MRangeReplyItem3 {
  labels: Labels;
}

export function parseResp2MrangeWithLabels(
  value: UnwrapReply<MrangeRawReplyValue2>
): MRangeWithLabelsReplyItem2 {
  const ret = parseResp2Mrange(value) as unknown as MRangeWithLabelsReplyItem2;
  ret.labels = transformLablesReply2(value[1]);

  return ret;
}

function parseResp3MrangeWithLabels(
  value: UnwrapReply<MrangeRawReplyValue3> | UnwrapReply<MrangeRawReplyValueGrouped3>,
  grouped?: boolean
): MRangeWithLabelsReplyItem3 {
  const ret = parseResp3Mrange(value, grouped) as unknown as MRangeWithLabelsReplyItem3;
  ret.labels = transformLablesReply3(value[0])

  return ret;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MRANGE'),
  transformReply: {
    2(reply: UnwrapReply<MRangeRawReply2>, preserve?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, parseResp2MrangeWithLabels, typeMapping);
    },
    3(reply: UnwrapReply<MRangeRawReply3>, grouped?: boolean) {
      return resp3MapToValue(reply, parseResp3MrangeWithLabels, grouped);
    }
  },
} as const satisfies Command;
