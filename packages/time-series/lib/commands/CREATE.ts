import {
    pushRetentionArgument,
    TimeSeriesEncoding,
    pushEncodingArgument,
    pushChunkSizeArgument,
    TimeSeriesDuplicatePolicies,
    Labels,
    pushLabelsArgument,
    pushDuplicatePolicy
} from '.';

export const FIRST_KEY_INDEX = 1;

interface CreateOptions {
    RETENTION?: number;
    ENCODING?: TimeSeriesEncoding;
    CHUNK_SIZE?: number;
    DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
    LABELS?: Labels;
}

export function transformArguments(key: string, options?: CreateOptions): Array<string> {
    const args = ['TS.CREATE', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushEncodingArgument(args, options?.ENCODING);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    return args;
}

export declare function transformReply(): 'OK';
