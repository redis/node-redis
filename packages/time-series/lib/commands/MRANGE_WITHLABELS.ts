import { RedisArgument, Command, UnwrapReply, MapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { MRangeRawReply2, MRangeReplyItem2, MRangeReplyItem3, TsMRangeOptions, pushGroupByArgument } from './MRANGE';
import { Labels, Timestamp, pushWithLabelsArgument, transformLablesReply2, transformLablesReply3, transformSamplesReply } from '.';
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

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MRANGE'),
  transformReply: {
    2: (reply: UnwrapReply<MRangeRawReply2>): Array<MRangeWithLabelsReplyItem2> => {
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
    3: (reply: UnwrapReply<MapReply<any, any>>): Array<MRangeReplyItem3> => {
      const args = [];

      if (reply instanceof Array) {
        for (const [key, labels, samples] of reply) {
          args.push({
            key,
            labels: transformLablesReply3(labels),
            samples: transformSamplesReply[3](samples)
          });
        }
      } else if (reply instanceof Map) {
        for (const [key, value] of reply) {
          args.push({
            key,
            labels: transformLablesReply3(value[0]),
            samples: transformSamplesReply[3](value[2])
          })
        }
      } else {
        for (const [key, value] of Object.entries(reply)) {
          args.push({
            key,
            labels: transformLablesReply3(value[0]),
            samples: transformSamplesReply[3](value[2])
          })
        }
      }

      return args;
    }
  },
} as const satisfies Command;
