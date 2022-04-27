import { pushOptionalVerdictArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisSearchLanguages, PropertyName, RediSearchSchema, pushSchema } from '.';

interface CreateOptions {
    ON?: 'HASH' | 'JSON';
    PREFIX?: string | Array<string>;
    FILTER?: string;
    LANGUAGE?: RedisSearchLanguages;
    LANGUAGE_FIELD?: PropertyName;
    SCORE?: number;
    SCORE_FIELD?: PropertyName;
    // PAYLOAD_FIELD?: string;
    MAXTEXTFIELDS?: true;
    TEMPORARY?: number;
    NOOFFSETS?: true;
    NOHL?: true;
    NOFIELDS?: true;
    NOFREQS?: true;
    SKIPINITIALSCAN?: true;
    STOPWORDS?: string | Array<string>;
}

export function transformArguments(index: string, schema: RediSearchSchema, options?: CreateOptions): Array<string> {
    const args = ['FT.CREATE', index];

    if (options?.ON) {
        args.push('ON', options.ON);
    }

    pushOptionalVerdictArgument(args, 'PREFIX', options?.PREFIX);

    if (options?.FILTER) {
        args.push('FILTER', options.FILTER);
    }

    if (options?.LANGUAGE) {
        args.push('LANGUAGE', options.LANGUAGE);
    }

    if (options?.LANGUAGE_FIELD) {
        args.push('LANGUAGE_FIELD', options.LANGUAGE_FIELD);
    }

    if (options?.SCORE) {
        args.push('SCORE', options.SCORE.toString());
    }

    if (options?.SCORE_FIELD) {
        args.push('SCORE_FIELD', options.SCORE_FIELD);
    }

    // if (options?.PAYLOAD_FIELD) {
    //     args.push('PAYLOAD_FIELD', options.PAYLOAD_FIELD);
    // }

    if (options?.MAXTEXTFIELDS) {
        args.push('MAXTEXTFIELDS');
    }

    if (options?.TEMPORARY) {
        args.push('TEMPORARY', options.TEMPORARY.toString());
    }

    if (options?.NOOFFSETS) {
        args.push('NOOFFSETS');
    }

    if (options?.NOHL) {
        args.push('NOHL');
    }

    if (options?.NOFIELDS) {
        args.push('NOFIELDS');
    }

    if (options?.NOFREQS) {
        args.push('NOFREQS');
    }

    if (options?.SKIPINITIALSCAN) {
        args.push('SKIPINITIALSCAN');
    }

    pushOptionalVerdictArgument(args, 'STOPWORDS', options?.STOPWORDS);
    args.push('SCHEMA');
    pushSchema(args, schema);

    return args;
}

export declare function transformReply(): 'OK';
