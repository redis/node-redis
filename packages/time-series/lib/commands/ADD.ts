import {
    transformTimestampArgument,
    pushRetentionArgument,
    TimeSeriesEncoding,
    pushEncodingArgument,
    pushChunkSizeArgument,
    TimeSeriesDuplicatePolicies,
    Labels,
    pushLabelsArgument,
    Timestamp,
} from '.';

interface AddOptions {
    RETENTION?: number;
    ENCODING?: TimeSeriesEncoding;
    CHUNK_SIZE?: number;
    ON_DUPLICATE?: TimeSeriesDuplicatePolicies;
    LABELS?: Labels;
}

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, timestamp: Timestamp, value: number, options?: AddOptions): Array<string> {
    const args = [
        'TS.ADD',
        key,
        transformTimestampArgument(timestamp),
        value.toString()
    ];

    pushRetentionArgument(args, options?.RETENTION);

    pushEncodingArgument(args, options?.ENCODING);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    if (options?.ON_DUPLICATE) {
        args.push('ON_DUPLICATE', options.ON_DUPLICATE);
    }

    pushLabelsArgument(args, options?.LABELS);

    return args;
}

export declare function transformReply(): number;
