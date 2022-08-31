import { TimeSeriesAggregationType, TimeSeriesDuplicatePolicies } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['TS.INFO', key];
}

export type InfoRawReply = [
    'totalSamples',
    number,
    'memoryUsage',
    number,
    'firstTimestamp',
    number,
    'lastTimestamp',
    number,
    'retentionTime',
    number,
    'chunkCount',
    number,
    'chunkSize',
    number,
    'chunkType',
    string,
    'duplicatePolicy',
    TimeSeriesDuplicatePolicies | null,
    'labels',
    Array<[name: string, value: string]>,
    'sourceKey',
    string | null,
    'rules',
    Array<[key: string, timeBucket: number, aggregationType: TimeSeriesAggregationType]>
];

export interface InfoReply {
    totalSamples: number;
    memoryUsage: number;
    firstTimestamp: number;
    lastTimestamp: number;
    retentionTime: number;
    chunkCount: number;
    chunkSize: number;
    chunkType: string;
    duplicatePolicy: TimeSeriesDuplicatePolicies | null;
    labels: Array<{
        name: string;
        value: string;
    }>;
    sourceKey: string | null;
    rules: Array<{
        key: string;
        timeBucket: number;
        aggregationType: TimeSeriesAggregationType
    }>;
}

export function transformReply(reply: InfoRawReply): InfoReply {
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
}
