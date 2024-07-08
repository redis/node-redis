import { RedisArgument, Command, CommandArguments, ReplyUnion, UnwrapReply, ArrayReply, BlobStringReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RawLabels, SampleRawReply, SamplesRawReply, Timestamp, transformSampleReply, transformSamplesReply } from '.';
import { TsRangeOptions, pushRangeArguments } from './RANGE';
import { pushFilterArgument } from './MGET';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';

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
          samples: transformSamplesReply[2](samples as unknown as Resp2Reply<SamplesRawReply>)
        });
      }
  
      return args;
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3Module: true
} as const satisfies Command;
