import { CommandParser } from '@redis/client/lib/client/parser';
import { ArrayReply, BlobStringReply, Command, DoubleReply, NumberReply, ReplyUnion, SimpleStringReply, TypeMapping } from "@redis/client/lib/RESP/types";
import { TimeSeriesDuplicatePolicies } from ".";
import { TimeSeriesAggregationType } from "./CREATERULE";
import { transformDoubleReply } from '@redis/client/lib/commands/generic-transformers';

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

export default {
    IS_READ_ONLY: true,
    parseCommand(parser: CommandParser, key: string) {
      parser.push('TS.INFO');
      parser.pushKey(key);
    },
    transformReply: {
      2: (reply: InfoRawReply, _, typeMapping?: TypeMapping): InfoReply => {
        const ret = {} as any;

        for (let i=0; i < reply.length; i += 2) {
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
              ret[key] = reply[i+1];
              break;
            case 'labels':
              ret[key] = (reply[i+1] as Array<[name: BlobStringReply, value: BlobStringReply]>).map(
                ([name, value]) => ({
                  name,
                  value
                })
              );
              break;
            case 'rules':
              ret[key] = (reply[i+1] as Array<[key: BlobStringReply, timeBucket: NumberReply, aggregationType: TimeSeriesAggregationType]>).map(
                ([key, timeBucket, aggregationType]) => ({
                  key,
                  timeBucket,
                  aggregationType
                })
              );
              break;
            case 'ignoreMaxValDiff':
              ret[key] = transformDoubleReply[2](reply[27] as unknown as BlobStringReply, undefined, typeMapping);
              break;
          }
        }

        return ret;
      },
      3: undefined as unknown as () => ReplyUnion
    },
    unstableResp3: true
  } as const satisfies Command;
