import { RedisArgument, Command, CommandArguments, UnwrapReply, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RawLabels2, RawLabels3, resp3MapToValue, SampleRawReply, Timestamp, transformSampleReply, transformSamplesReply } from '.';
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

    args.preserve = true;
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
  labels: RawLabels2,
  samples: ArrayReply<Resp2Reply<SampleRawReply>>
]>;


export type MrangeRawReplyValue3 = TuplesReply<[
  labels: RawLabels3,
  // TODO: unsure what tod with this element, not part of resp2 at all
  _: MapReply<BlobStringReply, ArrayReply<unknown>>,
  samples: ArrayReply<SampleRawReply>
]>;

export type MrangeRawReplyValueGrouped3 = TuplesReply<[
  labels: RawLabels3,
  reducers: MapReply<BlobStringReply, ArrayReply<unknown>>,
  sources: MapReply<BlobStringReply, ArrayReply<unknown>>,
  samples: ArrayReply<SampleRawReply>
]>;

export type MRangeRawReply3 = MapReply<
  BlobStringReply,
  MrangeRawReplyValue3 | MrangeRawReplyValueGrouped3
>;

export interface MRangeReplyItem2 {
  key: BlobStringReply;
  samples: Array<ReturnType<typeof transformSampleReply[2]>>;
}

export interface MRangeReplyItem3 {
  key: BlobStringReply | string;
  samples: Array<ReturnType<typeof transformSampleReply[3]>>;
}

export function getSamples(
  v: UnwrapReply<MrangeRawReplyValue3> | UnwrapReply<MrangeRawReplyValueGrouped3>,
  grouped?: boolean
): ArrayReply<SampleRawReply> {
  if (grouped) {
    const value = v as unknown as UnwrapReply<MrangeRawReplyValueGrouped3>;
    return value[3];
  } else {
    const value = v as unknown as UnwrapReply<MrangeRawReplyValue3>;
    return value[2];
  }
}

export function parseResp3Mrange(
  key: BlobStringReply | string,
  value: UnwrapReply<MrangeRawReplyValue3> | UnwrapReply<MrangeRawReplyValueGrouped3>,
  grouped?: boolean
): MRangeReplyItem3 {
  return {
    key,
    samples: transformSamplesReply[3](getSamples(value, grouped))
  }
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeArguments.bind(undefined, 'TS.MRANGE'),
  transformReply: {
    2(reply: UnwrapReply<MRangeRawReply2>): Array<MRangeReplyItem2> {
      const args = [];

      for (const [key, _, samples] of reply) {
        args.push({
          key,
          samples: transformSamplesReply[2](samples)
        });
      }

      return args;
    },
    3(reply: UnwrapReply<MRangeRawReply3>, grouped?: boolean): Array<MRangeReplyItem3> {
      return resp3MapToValue(reply, parseResp3Mrange, grouped)
    }
  },
} as const satisfies Command;
