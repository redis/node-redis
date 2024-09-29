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
    pushIgnoreArgument,
} from '.';

export interface TsIgnoreOptions {
  MAX_TIME_DIFF: number;
  MAX_VAL_DIFF: number;
}

interface AddOptions {
    RETENTION?: number;
    ENCODING?: TimeSeriesEncoding;
    CHUNK_SIZE?: number;
    ON_DUPLICATE?: TimeSeriesDuplicatePolicies;
    LABELS?: Labels;
    IGNORE?: TsIgnoreOptions;
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

    pushIgnoreArgument(args, options?.IGNORE);

    return args;
}

export declare function transformReply(): number;
