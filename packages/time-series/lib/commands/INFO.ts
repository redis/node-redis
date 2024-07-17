import { BlobStringReply, Command, NumberReply, SimpleStringReply } from "@redis/client/dist/lib/RESP/types";
import { TimeSeriesDuplicatePolicies } from ".";
import { TimeSeriesAggregationType } from "./CREATERULE";

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
  Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>
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
}

export default {
    FIRST_KEY_INDEX: 1,
    IS_READ_ONLY: true,
    transformArguments(key: string) {
      return ['TS.INFO', key];
    },
    transformReply: {
      2: (reply: InfoRawReply): InfoReply => {
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
          }))
        };
      },
      3: undefined as unknown as () => InfoReply
    }
  } as const satisfies Command;