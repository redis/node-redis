import { RedisArgument, Command, UnwrapReply, BlobStringReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { MRangeRawReply2, MRangeRawReply3, MRangeReplyItem2, MRangeReplyItem3, MrangeRawReplyValue3, MrangeRawReplyValueGrouped3, TsMRangeOptions, parseResp3Mrange, pushGroupByArgument } from './MRANGE';
import { Labels, Timestamp, pushWithLabelsArgument, resp3MapToValue, transformLablesReply2, transformLablesReply3, transformSamplesReply } from '.';
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

function parseResp3MrangeWithLabels(
  key: BlobStringReply | string,
  value: UnwrapReply<MrangeRawReplyValue3> | UnwrapReply<MrangeRawReplyValueGrouped3>,
  grouped?: boolean
): MRangeWithLabelsReplyItem3 {
  const ret = parseResp3Mrange(key, value, grouped) as MRangeWithLabelsReplyItem3;
  ret.labels = transformLablesReply3(value[0])

  return ret;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MRANGE'),
  transformReply: {
    2(reply: UnwrapReply<MRangeRawReply2>): Array<MRangeWithLabelsReplyItem2> {
      const args = [];

      for (const [key, labels, samples] of reply) {
        args.push({
          key,
          labels: transformLablesReply2(labels),
          samples: transformSamplesReply[2](samples)
        });
      }

      return args;
    },
    3(reply: UnwrapReply<MRangeRawReply3>, grouped?: boolean): Array<MRangeWithLabelsReplyItem3> {
      return resp3MapToValue(reply, parseResp3MrangeWithLabels, grouped);
    }
  },
} as const satisfies Command;
