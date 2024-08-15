import { Command, MapReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument, MGetReply2, MGetRawReply2, MGetReply3 } from './MGET';
import { Labels, pushWithLabelsArgument, transformLablesReply2, transformLablesReply3, transformSampleReply } from '.';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export interface MGetWithLabelsReply2 extends MGetReply2 {
  labels: Labels;
};

export interface MGetWithLabelsReply3 extends MGetReply3 {
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
          labels: transformLablesReply2(labels),
          sample: transformSampleReply[2](sample)
      }));
    },
    3: (reply: UnwrapReply<MapReply<any, any>>): Array<MGetWithLabelsReply3> => {
      const args: Array<MGetWithLabelsReply3> = [];

      if (reply instanceof Array) {
        for (const [key, value] of reply) {
          args.push({
            key,
            labels: transformLablesReply3(value[0]),
            sample: transformSampleReply[3](value[1])
          });
        }
      } else if (reply instanceof Map) {
        for (const [key, value] of reply) {
          args.push({
            key,
            labels: transformLablesReply3(value[0]),
            sample: transformSampleReply[3](value[1])
          });
        }
      } else {
        for (const [key, value] of Object.entries(reply)) {
          args.push({
            key,
            labels: transformLablesReply3(value[0]),
            sample: transformSampleReply[3](value[1])
          });
        }
      }

      return args;
    },
  },
} as const satisfies Command;
