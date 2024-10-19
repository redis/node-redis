import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, ArrayReply, BlobStringReply, Resp2Reply, MapReply, TuplesReply, TypeMapping, RedisArgument, TuplesToMapReply, UnwrapReply } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, Timestamp, transformSamplesReply } from '.';
import { TsRangeOptions, parseRangeArguments } from './RANGE';
import { parseFilterArgument } from './MGET';

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
} as const;

export type TimeSeriesReducer = typeof TIME_SERIES_REDUCERS[keyof typeof TIME_SERIES_REDUCERS];

export interface TsMRangeGroupBy {
  label: RedisArgument;
  REDUCE: TimeSeriesReducer;
}

export function parseGroupByArguments(parser: CommandParser, groupBy: TsMRangeGroupBy) {
  parser.push('GROUPBY', groupBy.label, 'REDUCE', groupBy.REDUCE);
}

export type TsMRangeGroupByRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never, // empty array without WITHLABELS or SELECTED_LABELS
    samples: ArrayReply<Resp2Reply<SampleRawReply>>
  ]>
>;

export type TsMRangeGroupByRawMetadataReply3 = TuplesToMapReply<[
  [BlobStringReply<'sources'>, ArrayReply<BlobStringReply>]
]>;

export type TsMRangeGroupByRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never, // empty hash without WITHLABELS or SELECTED_LABELS
    metadata1: never, // ?!
    metadata2: TsMRangeGroupByRawMetadataReply3,
    samples: ArrayReply<SampleRawReply>
  ]>
>;

export function createTransformMRangeGroupByArguments(command: RedisArgument) {
  return (
    parser: CommandParser,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filter: RedisVariadicArgument,
    groupBy: TsMRangeGroupBy,
    options?: TsRangeOptions
  ) => {
    parser.push(command);
    parseRangeArguments(parser, fromTimestamp, toTimestamp, options)

    parseFilterArgument(parser, filter);

    parseGroupByArguments(parser, groupBy);
  };
}

export function extractResp3MRangeSources(raw: TsMRangeGroupByRawMetadataReply3) {
  const unwrappedMetadata2 = raw as unknown as UnwrapReply<typeof raw>;
  if (unwrappedMetadata2 instanceof Map) {
    return unwrappedMetadata2.get('sources')!;
  } else if (unwrappedMetadata2 instanceof Array) {
    return unwrappedMetadata2[1];
  } else {
    return unwrappedMetadata2.sources;
  }
}

export default {
  IS_READ_ONLY: true,
  parseCommand: createTransformMRangeGroupByArguments('TS.MRANGE'),
  transformReply: {
    2(reply: TsMRangeGroupByRawReply2, _?: any, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([_key, _labels, samples]) => {
        return {
          samples: transformSamplesReply[2](samples)
        };
      }, typeMapping);
    },
    3(reply: TsMRangeGroupByRawReply3) {
      return resp3MapToValue(reply, ([_labels, _metadata1, metadata2, samples]) => {
        return {
          sources: extractResp3MRangeSources(metadata2),
          samples: transformSamplesReply[3](samples)
        };
      });
    }
  },
} as const satisfies Command;
