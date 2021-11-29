import { TimeSeriesAggregationType } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    sourceKey: string,
    destinationKey: string,
    aggregationType: TimeSeriesAggregationType,
    timeBucket: number
): Array<string> {
    return [
        'TS.CREATERULE',
        sourceKey,
        destinationKey,
        aggregationType,
        timeBucket.toString()
    ];
}

export declare function transfromReply(): 'OK';
