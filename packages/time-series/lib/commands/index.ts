import type { DoubleReply, NumberReply, RedisCommands, TuplesReply, UnwrapReply, Resp2Reply, ArrayReply, BlobStringReply, MapReply, NullReply, TypeMapping, ReplyUnion, RespType } from '@redis/client/lib/RESP/types';
import ADD, { TsIgnoreOptions } from './ADD';
import ALTER from './ALTER';
import CREATE from './CREATE';
import CREATERULE from './CREATERULE';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DELETERULE from './DELETERULE';
import GET from './GET';
import INCRBY from './INCRBY';
import INFO_DEBUG from './INFO_DEBUG';
import INFO from './INFO';
import MADD from './MADD';
import MGET_SELECTED_LABELS from './MGET_SELECTED_LABELS';
import MGET_WITHLABELS from './MGET_WITHLABELS';
import MGET from './MGET';
import MRANGE_GROUPBY from './MRANGE_GROUPBY';
import MRANGE_SELECTED_LABELS_GROUPBY from './MRANGE_SELECTED_LABELS_GROUPBY';
import MRANGE_SELECTED_LABELS from './MRANGE_SELECTED_LABELS';
import MRANGE_WITHLABELS_GROUPBY from './MRANGE_WITHLABELS_GROUPBY';
import MRANGE_WITHLABELS from './MRANGE_WITHLABELS';
import MRANGE from './MRANGE';
import MREVRANGE_GROUPBY from './MREVRANGE_GROUPBY';
import MREVRANGE_SELECTED_LABELS_GROUPBY from './MREVRANGE_SELECTED_LABELS_GROUPBY';
import MREVRANGE_SELECTED_LABELS from './MREVRANGE_SELECTED_LABELS';
import MREVRANGE_WITHLABELS_GROUPBY from './MREVRANGE_WITHLABELS_GROUPBY';
import MREVRANGE_WITHLABELS from './MREVRANGE_WITHLABELS';
import MREVRANGE from './MREVRANGE';
import QUERYINDEX from './QUERYINDEX';
import RANGE from './RANGE';
import REVRANGE from './REVRANGE';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { CommandParser } from '@redis/client/lib/client/parser';
import { RESP_TYPES } from '@redis/client/lib/RESP/decoder';

export default {
  ADD,
  add: ADD,
  ALTER,
  alter: ALTER,
  CREATE,
  create: CREATE,
  CREATERULE,
  createRule: CREATERULE,
  DECRBY,
  decrBy: DECRBY,
  DEL,
  del: DEL,
  DELETERULE,
  deleteRule: DELETERULE,
  GET,
  get: GET,
  INCRBY,
  incrBy: INCRBY,
  INFO_DEBUG,
  infoDebug: INFO_DEBUG,
  INFO,
  info: INFO,
  MADD,
  mAdd: MADD,
  MGET_SELECTED_LABELS,
  mGetSelectedLabels: MGET_SELECTED_LABELS,
  MGET_WITHLABELS,
  mGetWithLabels: MGET_WITHLABELS,
  MGET,
  mGet: MGET,
  MRANGE_GROUPBY,
  mRangeGroupBy: MRANGE_GROUPBY,
  MRANGE_SELECTED_LABELS_GROUPBY,
  mRangeSelectedLabelsGroupBy: MRANGE_SELECTED_LABELS_GROUPBY,
  MRANGE_SELECTED_LABELS,
  mRangeSelectedLabels: MRANGE_SELECTED_LABELS,
  MRANGE_WITHLABELS_GROUPBY,
  mRangeWithLabelsGroupBy: MRANGE_WITHLABELS_GROUPBY,
  MRANGE_WITHLABELS,
  mRangeWithLabels: MRANGE_WITHLABELS,
  MRANGE,
  mRange: MRANGE,
  MREVRANGE_GROUPBY,
  mRevRangeGroupBy: MREVRANGE_GROUPBY,
  MREVRANGE_SELECTED_LABELS_GROUPBY,
  mRevRangeSelectedLabelsGroupBy: MREVRANGE_SELECTED_LABELS_GROUPBY,
  MREVRANGE_SELECTED_LABELS,
  mRevRangeSelectedLabels: MREVRANGE_SELECTED_LABELS,
  MREVRANGE_WITHLABELS_GROUPBY,
  mRevRangeWithLabelsGroupBy: MREVRANGE_WITHLABELS_GROUPBY,
  MREVRANGE_WITHLABELS,
  mRevRangeWithLabels: MREVRANGE_WITHLABELS,
  MREVRANGE,
  mRevRange: MREVRANGE,
  QUERYINDEX,
  queryIndex: QUERYINDEX,
  RANGE,
  range: RANGE,
  REVRANGE,
  revRange: REVRANGE
} as const satisfies RedisCommands;

export function parseIgnoreArgument(parser: CommandParser, ignore?: TsIgnoreOptions) {
  if (ignore !== undefined) {
    parser.push('IGNORE', ignore.maxTimeDiff.toString(), ignore.maxValDiff.toString());
  }
}

export function parseRetentionArgument(parser: CommandParser, retention?: number) {
  if (retention !== undefined) {
    parser.push('RETENTION', retention.toString());
  }
}

export const TIME_SERIES_ENCODING = {
  COMPRESSED: 'COMPRESSED',
  UNCOMPRESSED: 'UNCOMPRESSED'
} as const;

export type TimeSeriesEncoding = typeof TIME_SERIES_ENCODING[keyof typeof TIME_SERIES_ENCODING];

export function parseEncodingArgument(parser: CommandParser, encoding?: TimeSeriesEncoding) {
  if (encoding !== undefined) {
    parser.push('ENCODING', encoding);
  }
}

export function parseChunkSizeArgument(parser: CommandParser, chunkSize?: number) {
  if (chunkSize !== undefined) {
    parser.push('CHUNK_SIZE', chunkSize.toString());
  }
}

export const TIME_SERIES_DUPLICATE_POLICIES = {
  BLOCK: 'BLOCK',
  FIRST: 'FIRST',
  LAST: 'LAST',
  MIN: 'MIN',
  MAX: 'MAX',
  SUM: 'SUM'
} as const;

export type TimeSeriesDuplicatePolicies = typeof TIME_SERIES_DUPLICATE_POLICIES[keyof typeof TIME_SERIES_DUPLICATE_POLICIES];

export function parseDuplicatePolicy(parser: CommandParser, duplicatePolicy?: TimeSeriesDuplicatePolicies) {
  if (duplicatePolicy !== undefined) {
    parser.push('DUPLICATE_POLICY', duplicatePolicy);
  }
}

export type Timestamp = number | Date | string;

export function transformTimestampArgument(timestamp: Timestamp): string {
  if (typeof timestamp === 'string') return timestamp;

  return (
    typeof timestamp === 'number' ?
      timestamp :
      timestamp.getTime()
  ).toString();
}

export type Labels = {
  [label: string]: string;
};

export function parseLabelsArgument(parser: CommandParser, labels?: Labels) {
  if (labels) {
    parser.push('LABELS');

    for (const [label, value] of Object.entries(labels)) {
      parser.push(label, value);
    }
  }
}

export type SampleRawReply = TuplesReply<[timestamp: NumberReply, value: DoubleReply]>;

export const transformSampleReply = {
  2(reply: Resp2Reply<SampleRawReply>) {
    const [ timestamp, value ] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value: Number(value) // TODO: use double type mapping instead
    };
  },
  3(reply: SampleRawReply) {
    const [ timestamp, value ] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value
    };
  }
};

export type SamplesRawReply = ArrayReply<SampleRawReply>;

export const transformSamplesReply = {
  2(reply: Resp2Reply<SamplesRawReply>) {
    return (reply as unknown as UnwrapReply<typeof reply>)
      .map(sample => transformSampleReply[2](sample));
  },
  3(reply: SamplesRawReply) {
    return (reply as unknown as UnwrapReply<typeof reply>)
      .map(sample => transformSampleReply[3](sample));
  }
};

// TODO: move to @redis/client?
export function resp2MapToValue<
  RAW_VALUE extends TuplesReply<[key: BlobStringReply, ...rest: Array<ReplyUnion>]>,
  TRANSFORMED
>(
  wrappedReply: ArrayReply<RAW_VALUE>,
  parseFunc: (rawValue: UnwrapReply<RAW_VALUE>) => TRANSFORMED,
  typeMapping?: TypeMapping
): MapReply<BlobStringReply, TRANSFORMED> {
  const reply = wrappedReply as unknown as UnwrapReply<typeof wrappedReply>;
  switch (typeMapping?.[RESP_TYPES.MAP]) {
    case Map: {
      const ret = new Map<string, TRANSFORMED>();
      for (const wrappedTuple of reply) {
        const tuple = wrappedTuple as unknown as UnwrapReply<typeof wrappedTuple>;
        const key = tuple[0] as unknown as UnwrapReply<typeof tuple[0]>;
        ret.set(key.toString(), parseFunc(tuple));
      }
      return ret as never;
    }
    case Array: {
      for (const wrappedTuple of reply) {
        const tuple = wrappedTuple as unknown as UnwrapReply<typeof wrappedTuple>;
        (tuple[1] as unknown as TRANSFORMED) = parseFunc(tuple);
      }
      return reply as never;
    }
    default: {
      const ret: Record<string, TRANSFORMED> = Object.create(null);
      for (const wrappedTuple of reply) {
        const tuple = wrappedTuple as unknown as UnwrapReply<typeof wrappedTuple>;
        const key = tuple[0] as unknown as UnwrapReply<typeof tuple[0]>;
        ret[key.toString()] = parseFunc(tuple);
      }
      return ret as never;
    }
  } 
}

export function resp3MapToValue<
  RAW_VALUE extends RespType<any, any, any, any>, // TODO: simplify types
  TRANSFORMED
>(
  wrappedReply: MapReply<BlobStringReply, RAW_VALUE>,
  parseFunc: (rawValue: UnwrapReply<RAW_VALUE>) => TRANSFORMED
): MapReply<BlobStringReply, TRANSFORMED> {
  const reply = wrappedReply as unknown as UnwrapReply<typeof wrappedReply>;  
  if (reply instanceof Array) {
    for (let i = 1; i < reply.length; i += 2) {
      (reply[i] as unknown as TRANSFORMED) = parseFunc(reply[i] as unknown as UnwrapReply<RAW_VALUE>);
    }
  } else if (reply instanceof Map) {
    for (const [key, value] of reply.entries()) {
      (reply as unknown as Map<BlobStringReply, TRANSFORMED>).set(
        key,
        parseFunc(value as unknown as UnwrapReply<typeof value>)
      );
    }
  } else {
    for (const [key, value] of Object.entries(reply)) {
      (reply[key] as unknown as TRANSFORMED) = parseFunc(value as unknown as UnwrapReply<typeof value>);
    }
  }
  return reply as never;
}

export function parseSelectedLabelsArguments(
  parser: CommandParser,
  selectedLabels: RedisVariadicArgument
) {
  parser.push('SELECTED_LABELS');
  parser.pushVariadic(selectedLabels);
}

export type RawLabelValue = BlobStringReply | NullReply;

export type RawLabels<T extends RawLabelValue> = ArrayReply<TuplesReply<[
  label: BlobStringReply,
  value: T
]>>;

export function transformRESP2Labels<T extends RawLabelValue>(
  labels: RawLabels<T>,
  typeMapping?: TypeMapping
): MapReply<BlobStringReply, T> {
  const unwrappedLabels = labels as unknown as UnwrapReply<typeof labels>;
  switch (typeMapping?.[RESP_TYPES.MAP]) {
    case Map:
      const map = new Map<string, T>();
      for (const tuple of unwrappedLabels) {
        const [key, value] = tuple as unknown as UnwrapReply<typeof tuple>;
        const unwrappedKey = key as unknown as UnwrapReply<typeof key>;
        map.set(unwrappedKey.toString(), value);
      }
      return map as never;

    case Array:
      return unwrappedLabels.flat() as never;

    case Object:
    default:
      const labelsObject: Record<string, T> = Object.create(null);
      for (const tuple of unwrappedLabels) {
        const [key, value] = tuple as unknown as UnwrapReply<typeof tuple>;
        const unwrappedKey = key as unknown as UnwrapReply<typeof key>;
        labelsObject[unwrappedKey.toString()] = value;
      }
      return labelsObject as never;
  }
}

export function transformRESP2LabelsWithSources<T extends RawLabelValue>(
  labels: RawLabels<T>,
  typeMapping?: TypeMapping
) {
  const unwrappedLabels = labels as unknown as UnwrapReply<typeof labels>;
  const to = unwrappedLabels.length - 2; // ignore __reducer__ and __source__
  let transformedLabels: MapReply<BlobStringReply, T>;
  switch (typeMapping?.[RESP_TYPES.MAP]) {
    case Map:
      const map = new Map<string, T>();
      for (let i = 0; i < to; i++) {
        const [key, value] = unwrappedLabels[i] as unknown as UnwrapReply<typeof unwrappedLabels[number]>;
        const unwrappedKey = key as unknown as UnwrapReply<typeof key>;
        map.set(unwrappedKey.toString(), value);
      }
      transformedLabels = map as never;
      break;

    case Array:
      transformedLabels = unwrappedLabels.slice(0, to).flat() as never;
      break;

    case Object:
    default:
      const labelsObject: Record<string, T> = Object.create(null);
      for (let i = 0; i < to; i++) {
        const [key, value] = unwrappedLabels[i] as unknown as UnwrapReply<typeof unwrappedLabels[number]>;
        const unwrappedKey = key as unknown as UnwrapReply<typeof key>;
        labelsObject[unwrappedKey.toString()] = value;
      }
      transformedLabels = labelsObject as never;
      break;
  }

  const sourcesTuple = unwrappedLabels[unwrappedLabels.length - 1];
  const unwrappedSourcesTuple = sourcesTuple as unknown as UnwrapReply<typeof sourcesTuple>;
  // the __source__ label will never be null
  const transformedSources = transformRESP2Sources(unwrappedSourcesTuple[1] as BlobStringReply);

  return {
    labels: transformedLabels,
    sources: transformedSources
  };
}

function transformRESP2Sources(sourcesRaw: BlobStringReply) {
  // if a label contains "," this function will produce incorrcet results..
  // there is not much we can do about it, and we assume most users won't be using "," in their labels..
  
  const unwrappedSources = sourcesRaw as unknown as UnwrapReply<typeof sourcesRaw>;
  if (typeof unwrappedSources === 'string') {
    return unwrappedSources.split(',');
  }

  const indexOfComma = unwrappedSources.indexOf(',');
  if (indexOfComma === -1) {
    return [unwrappedSources];
  }

  const sourcesArray = [
    unwrappedSources.subarray(0, indexOfComma)
  ];

  let previousComma = indexOfComma + 1;
  while (true) {
    const indexOf = unwrappedSources.indexOf(',', previousComma);
    if (indexOf === -1) {
      sourcesArray.push(
        unwrappedSources.subarray(previousComma)
      );
      break;
    }

    const source = unwrappedSources.subarray(
      previousComma,
      indexOf
    );
    sourcesArray.push(source);
    previousComma = indexOf + 1;
  }

  return sourcesArray;
}
