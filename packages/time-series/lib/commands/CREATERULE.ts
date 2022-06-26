import { TimeSeriesAggregationType } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    sourceKey: string,
    destinationKey: string,
    aggregationType: TimeSeriesAggregationType,
    timeBucket: number,
    alignTimestamp: number
): Array<string> {
    return [
        'TS.CREATERULE',
        sourceKey,
        destinationKey,
        'AGGREGATION',
        aggregationType,
        timeBucket.toString(),
        alignTimestamp.toString()
    ];
}

export declare function transformReply(): 'OK';
