import { TimeSeriesAggregationType } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    sourceKey: string,
    destinationKey: string,
    aggregationType: TimeSeriesAggregationType,
    bucketDuration: number,
    alignTimestamp?: number
): Array<string> {
    const args = [
        'TS.CREATERULE',
        sourceKey,
        destinationKey,
        'AGGREGATION',
        aggregationType,
        bucketDuration.toString()
    ];

    if (alignTimestamp) {
        args.push(alignTimestamp.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
