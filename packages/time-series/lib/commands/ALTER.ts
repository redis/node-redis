import { pushRetentionArgument, Labels, pushLabelsArgument, TimeSeriesDuplicatePolicies, pushChunkSizeArgument, pushDuplicatePolicy, pushIgnoreArgument } from '.';
import { TsIgnoreOptions } from './ADD';

export const FIRST_KEY_INDEX = 1;

interface AlterOptions {
    RETENTION?: number;
    CHUNK_SIZE?: number;
    DUPLICATE_POLICY?: TimeSeriesDuplicatePolicies;
    LABELS?: Labels;
    IGNORE?: TsIgnoreOptions;
}

export function transformArguments(key: string, options?: AlterOptions): Array<string> {
    const args = ['TS.ALTER', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushDuplicatePolicy(args, options?.DUPLICATE_POLICY);

    pushLabelsArgument(args, options?.LABELS);

    pushIgnoreArgument(args, options?.IGNORE);

    return args;
}

export declare function transformReply(): 'OK';
