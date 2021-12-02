import { Timestamp, transformTimestampArgument } from '.';

export const FIRST_KEY_INDEX = 1;

interface MAddSample {
    key: string;
    timestamp: Timestamp;
    value: number;
}

export function transformArguments(toAdd: Array<MAddSample>): Array<string> {
    const args = ['TS.MADD'];

    for (const { key, timestamp, value } of toAdd) {
        args.push(
            key,
            transformTimestampArgument(timestamp),
            value.toString()
        );
    }

    return args;
}

export declare function transformReply(): Array<number>;
