import {
    pushRetentionArgument,
    TimeSeriesEncoding,
    pushEncodingArgument,
    pushChunkSizeArgument,
    TimeSeriesDuplicatePolicies,
    Labels,
    pushLabelsArgument,
    pushDuplicatePolicy,
    pushIgnoreArgument
} from '.';
import { TsIgnoreOptions } from './ADD';

export const FIRST_KEY_INDEX = 1;

interface CreateOptions {
    RETENTION?: number;
    ENCODING?: TimeSeriesEncoding;
    CHUNK_SIZE?: number;
    DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
    LABELS?: Labels;
    IGNORE?: TsIgnoreOptions;
}

export function transformArguments(key: string, options?: CreateOptions): Array<string> {
    const args = ['TS.CREATE', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushEncodingArgument(args, options?.ENCODING);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    pushIgnoreArgument(args, options?.IGNORE);

    return args;
}

export declare function transformReply(): 'OK';
