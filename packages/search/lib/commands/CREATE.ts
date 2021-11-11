import { pushOptionalVerdictArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisSearchLanguages, PropertyName } from '.';

export enum SchemaFieldTypes {
    TEXT = 'TEXT',
    NUMERIC = 'NUMERIC',
    GEO = 'GEO',
    TAG = 'TAG'
}

type CreateSchemaField<T extends SchemaFieldTypes, E = Record<string, never>> = T | ({
    type: T;
    AS?: string;
    SORTABLE?: true | 'UNF';
    NOINDEX?: true;
} & E);

export enum SchemaTextFieldPhonetics {
    DM_EN = 'dm:en',
    DM_FR = 'dm:fr',
    FM_PT = 'dm:pt',
    DM_ES = 'dm:es'
}

type CreateSchemaTextField = CreateSchemaField<SchemaFieldTypes.TEXT, {
    NOSTEM?: true;
    WEIGHT?: number;
    PHONETIC?: SchemaTextFieldPhonetics;
}>;

type CreateSchemaNumericField = CreateSchemaField<SchemaFieldTypes.NUMERIC>;

type CreateSchemaGeoField = CreateSchemaField<SchemaFieldTypes.GEO>;

type CreateSchemaTagField = CreateSchemaField<SchemaFieldTypes.TAG, {
    SEPERATOR?: string;
    CASESENSITIVE?: true;
}>;

interface CreateSchema {
    [field: string]:
        CreateSchemaTextField |
        CreateSchemaNumericField |
        CreateSchemaGeoField |
        CreateSchemaTagField
}

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

export function transformArguments(index: string, schema: CreateSchema, options?: CreateOptions): Array<string> {
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

    for (const [field, fieldOptions] of Object.entries(schema)) {
        args.push(field);

        if (typeof fieldOptions === 'string') {
            args.push(fieldOptions);
            continue;
        }

        if (fieldOptions.AS) {
            args.push('AS', fieldOptions.AS);
        }

        args.push(fieldOptions.type);

        switch (fieldOptions.type) {
            case 'TEXT':
                if (fieldOptions.NOSTEM) {
                    args.push('NOSTEM');
                }

                if (fieldOptions.WEIGHT) {
                    args.push('WEIGHT', fieldOptions.WEIGHT.toString());
                }

                if (fieldOptions.PHONETIC) {
                    args.push('PHONETIC', fieldOptions.PHONETIC);
                }

                break;

            // case 'NUMERIC':
            // case 'GEO':
            //     break;

            case 'TAG':
                if (fieldOptions.SEPERATOR) {
                    args.push('SEPERATOR', fieldOptions.SEPERATOR);
                }

                if (fieldOptions.CASESENSITIVE) {
                    args.push('CASESENSITIVE');
                }

                break;
        }

        if (fieldOptions.SORTABLE) {
            args.push('SORTABLE');

            if (fieldOptions.SORTABLE === 'UNF') {
                args.push('UNF');
            }
        }

        if (fieldOptions.NOINDEX) {
            args.push('NOINDEX');
        }
    }

    return args;
}

export declare function transformReply(): 'OK';
