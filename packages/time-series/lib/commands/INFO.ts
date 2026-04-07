import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, BlobStringReply, Command, DoubleReply, NumberReply, ReplyUnion, SimpleStringReply, TypeMapping } from "@redis/client/dist/lib/RESP/types";
import { TimeSeriesDuplicatePolicies } from "./helpers";
import { TIME_SERIES_AGGREGATION_TYPE, TimeSeriesAggregationType } from "./CREATERULE";
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export type InfoRawReplyTypes = SimpleStringReply | 
  NumberReply | 
  TimeSeriesDuplicatePolicies | null |
  Array<[name: BlobStringReply, value: BlobStringReply]> |
  BlobStringReply |
  Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]> |
  DoubleReply

export type InfoRawReply = Array<InfoRawReplyTypes>;

export type InfoRawReplyOld = [
  'totalSamples',
  NumberReply,
  'memoryUsage',
  NumberReply,
  'firstTimestamp',
  NumberReply,
  'lastTimestamp',
  NumberReply,
  'retentionTime',
  NumberReply,
  'chunkCount',
  NumberReply,
  'chunkSize',
  NumberReply,
  'chunkType',
  SimpleStringReply,
  'duplicatePolicy',
  TimeSeriesDuplicatePolicies | null,
  'labels',
  ArrayReply<[name: BlobStringReply, value: BlobStringReply]>,
  'sourceKey',
  BlobStringReply | null,
  'rules',
  ArrayReply<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>,
  'ignoreMaxTimeDiff',
  NumberReply,
  'ignoreMaxValDiff',
  DoubleReply,
];

export interface InfoReply {
  totalSamples: NumberReply;
  memoryUsage: NumberReply;
  firstTimestamp: NumberReply;
  lastTimestamp: NumberReply;
  retentionTime: NumberReply;
  chunkCount: NumberReply;
  chunkSize: NumberReply;
  chunkType: SimpleStringReply;
  duplicatePolicy: TimeSeriesDuplicatePolicies | null;
  labels: Array<{
    name: BlobStringReply;
    value: BlobStringReply;
  }>;
  sourceKey: BlobStringReply | null;
  rules: Array<{
    key: BlobStringReply;
    timeBucket: NumberReply;
    aggregationType: TimeSeriesAggregationType
  }>;
  /** Added in 7.4 */
  ignoreMaxTimeDiff: NumberReply;
  /** Added in 7.4 */
  ignoreMaxValDiff: DoubleReply;
}

function mapLikeEntries(value: unknown): Array<[string, any]> {
  if (value instanceof Map) {
    return Array.from(value.entries(), ([key, entryValue]) => [key.toString(), entryValue]);
  }

  if (Array.isArray(value)) {
    if (value.every(item => Array.isArray(item) && item.length >= 2)) {
      return value.map(item => [item[0].toString(), item[1]]);
    }

    const entries: Array<[string, any]> = [];
    for (let i = 0; i < value.length - 1; i += 2) {
      entries.push([value[i].toString(), value[i + 1]]);
    }
    return entries;
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value);
  }

  return [];
}

function mapLikeValues(value: unknown): Array<any> {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return [...value.values()];
  if (value !== null && typeof value === 'object') return Object.values(value);
  return [];
}

function mapLikeToObject(value: unknown): Record<string, any> {
  const object: Record<string, any> = {};
  for (const [key, entryValue] of mapLikeEntries(value)) {
    object[key] = entryValue;
  }
  return object;
}

function getMapValue(value: unknown, keys: Array<string>): any {
  const object = mapLikeToObject(value);

  for (const key of keys) {
    if (Object.hasOwn(object, key)) {
      return object[key];
    }
  }

  const lowerCaseKeyToOriginal = new Map<string, string>();
  for (const key of Object.keys(object)) {
    const lowerCaseKey = key.toLowerCase();
    if (!lowerCaseKeyToOriginal.has(lowerCaseKey)) {
      lowerCaseKeyToOriginal.set(lowerCaseKey, key);
    }
  }

  for (const key of keys) {
    const original = lowerCaseKeyToOriginal.get(key.toLowerCase());
    if (original !== undefined) {
      return object[original];
    }
  }

  return undefined;
}

function normalizeInfoLabels(labels: unknown): Array<[name: BlobStringReply, value: BlobStringReply]> {
  if (Array.isArray(labels)) {
    if (labels.every(item => Array.isArray(item) && item.length >= 2)) {
      return labels.map(item => [item[0], item[1]]);
    }

    const normalized = labels
      .map(label => {
        const object = mapLikeToObject(label);
        return [
          getMapValue(object, ['name', 'label']),
          getMapValue(object, ['value'])
        ] as [BlobStringReply, BlobStringReply];
      })
      .filter(([name]) => name !== undefined);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return mapLikeEntries(labels).map(([name, value]) => [name as unknown as BlobStringReply, value as BlobStringReply]);
}

function normalizeInfoRules(rules: unknown): Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]> {
  const normalized: Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]> = [];

  const aggregationTypes = new Set(
    Object.values(TIME_SERIES_AGGREGATION_TYPE).map(type => type.toUpperCase())
  );

  const parseRuleTuple = (rule: Array<any>): [BlobStringReply, NumberReply, TimeSeriesAggregationType] => {
    const stringCandidates = rule.filter(value => typeof value === 'string' || value instanceof Buffer);
    const numberCandidates = rule.filter(value => typeof value === 'number');

    const aggregationCandidate = stringCandidates.find(value => {
      return aggregationTypes.has(value.toString().toUpperCase());
    });

    const keyCandidate = stringCandidates.find(value => value !== aggregationCandidate);

    return [
      (keyCandidate ?? rule[0]) as BlobStringReply,
      (numberCandidates[0] ?? Number(rule[1])) as NumberReply,
      (aggregationCandidate ?? rule[2]) as TimeSeriesAggregationType
    ];
  };

  if (!Array.isArray(rules)) {
    for (const [key, value] of mapLikeEntries(rules)) {
      if (Array.isArray(value)) {
        const timeBucket = value.find(item => typeof item === 'number') ?? Number(value[0]);
        const aggregationType = value.find(item => {
          return (typeof item === 'string' || item instanceof Buffer) &&
            aggregationTypes.has(item.toString().toUpperCase());
        }) ?? value[1];

        normalized.push([
          key as unknown as BlobStringReply,
          timeBucket as NumberReply,
          aggregationType as TimeSeriesAggregationType
        ]);
        continue;
      }

      const object = mapLikeToObject(value);
      const timeBucket = getMapValue(object, ['timeBucket', 'time_bucket']) as NumberReply;
      const aggregationType = getMapValue(object, ['aggregationType', 'aggregation_type']) as TimeSeriesAggregationType;

      normalized.push([
        key as unknown as BlobStringReply,
        timeBucket,
        aggregationType
      ]);
    }

    return normalized;
  }

  if (Array.isArray(rules) && rules.every(rule => Array.isArray(rule) && rule.length >= 3)) {
    return rules.map(rule => parseRuleTuple(rule));
  }

  for (const rule of mapLikeValues(rules)) {
    if (Array.isArray(rule)) {
      normalized.push(parseRuleTuple(rule));
      continue;
    }

    const object = mapLikeToObject(rule);
    const key = getMapValue(object, ['key']);
    const timeBucket = getMapValue(object, ['timeBucket', 'time_bucket']);
    const aggregationType = getMapValue(object, ['aggregationType', 'aggregation_type']);
    normalized.push(parseRuleTuple([key, timeBucket, aggregationType]));
  }

  return normalized;
}

function normalizeInfoRawReply(reply: ReplyUnion): InfoRawReply {
  if (Array.isArray(reply)) {
    return reply as unknown as InfoRawReply;
  }

  const normalized: Array<any> = [];
  for (const [key, value] of mapLikeEntries(reply)) {
    switch (key) {
      case 'labels':
        normalized.push(key, normalizeInfoLabels(value));
        break;
      case 'rules':
        normalized.push(key, normalizeInfoRules(value));
        break;
      default:
        normalized.push(key, value);
        break;
    }
  }

  return normalized as InfoRawReply;
}

function transformInfoReplyResp2(reply: InfoRawReply, _: unknown, typeMapping?: TypeMapping): InfoReply {
  const ret = {} as any;

  for (let i = 0; i < reply.length; i += 2) {
    const key = (reply[i] as any).toString();

    switch (key) {
      case 'totalSamples':
      case 'memoryUsage':
      case 'firstTimestamp':
      case 'lastTimestamp':
      case 'retentionTime':
      case 'chunkCount':
      case 'chunkSize':
      case 'chunkType':
      case 'duplicatePolicy':
      case 'sourceKey':
      case 'ignoreMaxTimeDiff':
        ret[key] = reply[i + 1];
        break;
      case 'labels':
        ret[key] = (reply[i + 1] as Array<[name: BlobStringReply, value: BlobStringReply]>).map(
          ([name, value]) => ({
            name,
            value
          })
        );
        break;
      case 'rules':
        ret[key] = (reply[i + 1] as Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>).map(
          ([key, timeBucket, aggregationType]) => ({
            key,
            timeBucket,
            aggregationType
          })
        );
        break;
      case 'ignoreMaxValDiff':
        ret[key] = transformDoubleReply[2](reply[i + 1] as unknown as BlobStringReply, undefined, typeMapping);
        break;
    }
  }

  return ret;
}

function transformInfoReplyResp3(reply: ReplyUnion, preserve?: unknown, typeMapping?: TypeMapping): InfoReply {
  return transformInfoReplyResp2(normalizeInfoRawReply(reply), preserve, typeMapping);
}

export default {
    IS_READ_ONLY: true,
    /**
     * Gets information about a time series
     * @param parser - The command parser
     * @param key - The key name of the time series
     */
    parseCommand(parser: CommandParser, key: string) {
      parser.push('TS.INFO');
      parser.pushKey(key);
    },
    transformReply: {
      2: transformInfoReplyResp2,
      3: transformInfoReplyResp3
    },
  } as const satisfies Command;
