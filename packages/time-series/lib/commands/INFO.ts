import { BlobStringReply, Command, DoubleReply, NumberReply, SimpleStringReply, TypeMapping } from "@redis/client/dist/lib/RESP/types";
import { TimeSeriesDuplicatePolicies } from ".";
import { TimeSeriesAggregationType } from "./CREATERULE";
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
  /* Added in 7.4 */
  ignoreMaxTimeDiff: NumberReply | undefined;
  ignoreMaxValDiff: DoubleReply | undefined;
}

export default {
    FIRST_KEY_INDEX: 1,
    IS_READ_ONLY: true,
    transformArguments(key: string) {
      return ['TS.INFO', key];
    },
    transformReply: {
      2: (reply: InfoRawReply, _, typeMapping?: TypeMapping): InfoReply => {
        const ret: InfoReply = {
          totalSamples: reply[1] as NumberReply,
          memoryUsage: reply[3] as NumberReply,
          firstTimestamp: reply[5] as NumberReply,
          lastTimestamp: reply[7] as NumberReply,
          retentionTime: reply[9] as NumberReply,
          chunkCount: reply[11] as NumberReply,
          chunkSize: reply[13] as NumberReply,
          chunkType: reply[15] as SimpleStringReply,
          duplicatePolicy: reply[17] as TimeSeriesDuplicatePolicies | null,
          labels: (reply[19] as Array<[name: BlobStringReply, value: BlobStringReply]>).map(
            ([name, value]) => ({
              name,
              value
            })
          ),
          sourceKey: reply[21] as BlobStringReply | null,
          rules: (reply[23] as Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>).map(
            ([key, timeBucket, aggregationType]) => ({
              key,
              timeBucket,
              aggregationType
            })
          ),
          ignoreMaxTimeDiff: undefined,
          ignoreMaxValDiff: undefined
        };

        if (reply[24] != null && reply[24].toString() == 'ignoreMaxTimeDiff') {
          // > 7.4
          ret.ignoreMaxTimeDiff = reply[25] as NumberReply;
          ret.ignoreMaxValDiff = transformDoubleReply[2](reply[27] as unknown as BlobStringReply, undefined, typeMapping)
        }

        return ret;
      },
      3: undefined as unknown as () => InfoReply
    }
  } as const satisfies Command;