import { RedisArgument, Command, CommandArguments, UnwrapReply, ArrayReply, BlobStringReply, Resp2Reply, MapReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RawLabels, SampleRawReply, Timestamp, transformSampleReply, transformSamplesReply } from '.';
import { TsRangeOptions, pushRangeArguments } from './RANGE';
import { pushFilterArgument } from './MGET';

export const TIME_SERIES_REDUCERS = {
  AVG: 'AVG',
  SUM: 'SUM',
  MIN: 'MIN',
  MAX: 'MAX',
  RANGE: 'RANGE',
  COUNT: 'COUNT',
  STD_P: 'STD.P',
  STD_S: 'STD.S',
  VAR_P: 'VAR.P',
  VAR_S: 'VAR.S'
};

export type TimeSeriesReducers = typeof TIME_SERIES_REDUCERS[keyof typeof TIME_SERIES_REDUCERS];

export interface TsMRangeOptions extends TsRangeOptions {
  GROUPBY?: {
    label: RedisArgument;
    reducer: TimeSeriesReducers;
  };
}

export function pushGroupByArgument(args: CommandArguments, groupBy?: TsMRangeOptions['GROUPBY']) {
  if (groupBy) {
    args.push(
      'GROUPBY',
      groupBy.label,
      'REDUCE',
      groupBy.reducer
    );
  }

  return args;
}

export function transformMRangeArguments(
  command: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  filter: RedisVariadicArgument,
  options?: TsMRangeOptions
) {
  let args = pushRangeArguments(
    [command],
    fromTimestamp,
    toTimestamp,
    options
  );

  args = pushFilterArgument(args, filter);

  return pushGroupByArgument(args, options?.GROUPBY);
}

export type MRangeRawReply2 = ArrayReply<[
  key: BlobStringReply,
  labels: RawLabels,
  samples: ArrayReply<Resp2Reply<SampleRawReply>>
]>;

export interface MRangeReplyItem2 {
  key: BlobStringReply;
  samples: Array<ReturnType<typeof transformSampleReply[2]>>;
}

export interface MRangeReplyItem3 {
  key: BlobStringReply;
  samples: Array<ReturnType<typeof transformSampleReply[3]>>;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeArguments.bind(undefined, 'TS.MRANGE'),
  transformReply: {
    2: (reply: UnwrapReply<MRangeRawReply2>): Array<MRangeReplyItem2> => {
      const args = [];

      for (const [key, _, samples] of reply) {
        args.push({
          key,
          samples: transformSamplesReply[2](samples)
        });
      }

      return args;
    },
    3: (reply: UnwrapReply<MapReply<any, any>>): Array<MRangeReplyItem3> => {
      const args = [];

      if (reply instanceof Array) {
        for (const [key, _, samples] of reply) {
          args.push({
            key,
            samples: transformSamplesReply[3](samples)
          });
        }
      } else if (reply instanceof Map) {
        for (const [key, value] of reply) {
          args.push({
            key,
            samples: transformSamplesReply[3](value[2])
          })
        }
      } else {
        for (const [key, value] of Object.entries(reply)) {
          args.push({
            key,
            samples: transformSamplesReply[3](value[2])
          })
        }
      }

      return args;
    }
  },
} as const satisfies Command;
