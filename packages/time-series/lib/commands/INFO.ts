import { BlobStringReply, Command, DoubleReply, NumberReply, SimpleStringReply, TypeMapping } from "@redis/client/dist/lib/RESP/types";
import { TimeSeriesDuplicatePolicies } from ".";
import { TimeSeriesAggregationType } from "./CREATERULE";
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export type InfoRawReply = [
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
  Array<[name: BlobStringReply, value: BlobStringReply]>,
  'sourceKey',
  BlobStringReply | null,
  'rules',
  Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>,
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
  ignoreMaxTimeDiff: NumberReply;
  ignoreMaxValDiff: DoubleReply;
}

export default {
    FIRST_KEY_INDEX: 1,
    IS_READ_ONLY: true,
    transformArguments(key: string) {
      return ['TS.INFO', key];
    },
    transformReply: {
      2: (reply: InfoRawReply, _, typeMapping?: TypeMapping): InfoReply => {
        return {
          totalSamples: reply[1],
          memoryUsage: reply[3],
          firstTimestamp: reply[5],
          lastTimestamp: reply[7],
          retentionTime: reply[9],
          chunkCount: reply[11],
          chunkSize: reply[13],
          chunkType: reply[15],
          duplicatePolicy: reply[17],
          labels: reply[19].map(([name, value]) => ({
            name,
            value
          })),
          sourceKey: reply[21],
          rules: reply[23].map(([key, timeBucket, aggregationType]) => ({
            key,
            timeBucket,
            aggregationType
          })),
          ignoreMaxTimeDiff: reply[25],
          ignoreMaxValDiff: transformDoubleReply[2](reply[27] as unknown as BlobStringReply, undefined, typeMapping)
        };
      },
      3: undefined as unknown as () => InfoReply
    }
  } as const satisfies Command;