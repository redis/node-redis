import * as _LIST from './_LIST';
import * as ALTER from './ALTER';
import * as AGGREGATE from './AGGREGATE';
import * as ALIASADD from './ALIASADD';
import * as ALIASDEL from './ALIASDEL';
import * as ALIASUPDATE from './ALIASUPDATE';
import * as CONFIG_GET from './CONFIG_GET';
import * as CONFIG_SET from './CONFIG_SET';
import * as CREATE from './CREATE';
import * as DICTADD from './DICTADD';
import * as DICTDEL from './DICTDEL';
import * as DICTDUMP from './DICTDUMP';
import * as DROPINDEX from './DROPINDEX';
import * as EXPLAIN from './EXPLAIN';
import * as EXPLAINCLI from './EXPLAINCLI';
import * as INFO from './INFO';
import * as PROFILESEARCH from './PROFILE_SEARCH';
import * as PROFILEAGGREGATE from './PROFILE_AGGREGATE';
import * as SEARCH from './SEARCH';
import * as SPELLCHECK from './SPELLCHECK';
import * as SUGADD from './SUGADD';
import * as SUGDEL from './SUGDEL';
import * as SUGGET_WITHPAYLOADS from './SUGGET_WITHPAYLOADS';
import * as SUGGET_WITHSCORES_WITHPAYLOADS from './SUGGET_WITHSCORES_WITHPAYLOADS';
import * as SUGGET_WITHSCORES from './SUGGET_WITHSCORES';
import * as SUGGET from './SUGGET';
import * as SUGLEN from './SUGLEN';
import * as SYNDUMP from './SYNDUMP';
import * as SYNUPDATE from './SYNUPDATE';
import * as TAGVALS from './TAGVALS';
import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { pushOptionalVerdictArgument, pushVerdictArgument } from '@node-redis/client/dist/lib/commands/generic-transformers';
import { SearchOptions } from './SEARCH';

export default {
    _LIST,
    _list: _LIST,
    ALTER,
    alter: ALTER,
    AGGREGATE,
    aggregate: AGGREGATE,
    ALIASADD,
    aliasAdd: ALIASADD,
    ALIASDEL,
    aliasDel: ALIASDEL,
    ALIASUPDATE,
    aliasUpdate: ALIASUPDATE,
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_SET,
    configSet: CONFIG_SET,
    CREATE,
    create: CREATE,
    DICTADD,
    dictAdd: DICTADD,
    DICTDEL,
    dictDel: DICTDEL,
    DICTDUMP,
    dictDump: DICTDUMP,
    DROPINDEX,
    dropIndex: DROPINDEX,
    EXPLAIN,
    explain: EXPLAIN,
    EXPLAINCLI,
    explainCli: EXPLAINCLI,
    INFO,
    info: INFO,
    PROFILESEARCH,
    profileSearch: PROFILESEARCH,
    PROFILEAGGREGATE,
    profileAggregate: PROFILEAGGREGATE,
    SEARCH,
    search: SEARCH,
    SPELLCHECK,
    spellCheck: SPELLCHECK,
    SUGADD,
    sugAdd: SUGADD,
    SUGDEL,
    sugDel: SUGDEL,
    SUGGET_WITHPAYLOADS,
    sugGetWithPayloads: SUGGET_WITHPAYLOADS,
    SUGGET_WITHSCORES_WITHPAYLOADS,
    sugGetWithScoresWithPayloads: SUGGET_WITHSCORES_WITHPAYLOADS,
    SUGGET_WITHSCORES,
    sugGetWithScores: SUGGET_WITHSCORES,
    SUGGET,
    sugGet: SUGGET,
    SUGLEN,
    sugLen: SUGLEN,
    SYNDUMP,
    synDump: SYNDUMP,
    SYNUPDATE,
    synUpdate: SYNUPDATE,
    TAGVALS,
    tagVals: TAGVALS
};

export enum RedisSearchLanguages {
    ARABIC = 'Arabic',
    BASQUE = 'Basque',
    CATALANA = 'Catalan',
    DANISH = 'Danish',
    DUTCH = 'Dutch',
    ENGLISH = 'English',
    FINNISH = 'Finnish',
    FRENCH = 'French',
    GERMAN = 'German',
    GREEK = 'Greek',
    HUNGARIAN = 'Hungarian',
    INDONESAIN = 'Indonesian',
    IRISH = 'Irish',
    ITALIAN = 'Italian',
    LITHUANIAN = 'Lithuanian',
    NEPALI = 'Nepali',
    NORWEIGAN = 'Norwegian',
    PORTUGUESE = 'Portuguese',
    ROMANIAN = 'Romanian',
    RUSSIAN = 'Russian',
    SPANISH = 'Spanish',
    SWEDISH = 'Swedish',
    TAMIL = 'Tamil',
    TURKISH = 'Turkish',
    CHINESE = 'Chinese'
}

export type PropertyName = `${'@' | '$.'}${string}`;

export type SortByProperty = PropertyName | {
    BY: PropertyName;
    DIRECTION?: 'ASC' | 'DESC';
};

export function pushSortByProperty(args: RedisCommandArguments, sortBy: SortByProperty): void {
    if (typeof sortBy === 'string') {
        args.push(sortBy);
    } else {
        args.push(sortBy.BY);

        if (sortBy.DIRECTION) {
            args.push(sortBy.DIRECTION);
        }
    }
}

export function pushSortByArguments(args: RedisCommandArguments, name: string, sortBy: SortByProperty | Array<SortByProperty>): RedisCommandArguments {
    const lengthBefore = args.push(
        name,
        '' // will be overwritten
    );

    if (Array.isArray(sortBy)) {
        for (const field of sortBy) {
            pushSortByProperty(args, field);
        }
    } else {
        pushSortByProperty(args, sortBy);
    }

    args[lengthBefore - 1] = (args.length - lengthBefore).toString();

    return args;
}

export function pushArgumentsWithLength(args: RedisCommandArguments, fn: (args: RedisCommandArguments) => void): RedisCommandArguments {
    const lengthIndex = args.push('') - 1;
    fn(args);
    args[lengthIndex] = (args.length - lengthIndex - 1).toString();
    return args;
}

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
    SEPARATOR?: string;
    CASESENSITIVE?: true;
}>;

export interface CreateSchema {
    [field: string]:
        CreateSchemaTextField |
        CreateSchemaNumericField |
        CreateSchemaGeoField |
        CreateSchemaTagField
}

export function pushSchema(args: RedisCommandArguments, schema: CreateSchema) {
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
                if (fieldOptions.SEPARATOR) {
                    args.push('SEPARATOR', fieldOptions.SEPERATOR);
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
}

export function pushSearchOptions(
    args: RedisCommandArguments,
    options?: SearchOptions
): RedisCommandArguments {

    if (options?.VERBATIM) {
        args.push('VERBATIM');
    }

    if (options?.NOSTOPWORDS) {
        args.push('NOSTOPWORDS');
    }

    // if (options?.WITHSCORES) {
    //     args.push('WITHSCORES');
    // }

    // if (options?.WITHPAYLOADS) {
    //     args.push('WITHPAYLOADS');
    // }

    pushOptionalVerdictArgument(args, 'INKEYS', options?.INKEYS);
    pushOptionalVerdictArgument(args, 'INFIELDS', options?.INFIELDS);
    pushOptionalVerdictArgument(args, 'RETURN', options?.RETURN);

    if (options?.SUMMARIZE) {
        args.push('SUMMARIZE');

        if (typeof options.SUMMARIZE === 'object') {
            if (options.SUMMARIZE.FIELDS) {
                args.push('FIELDS');
                pushVerdictArgument(args, options.SUMMARIZE.FIELDS);
            }

            if (options.SUMMARIZE.FRAGS) {
                args.push('FRAGS', options.SUMMARIZE.FRAGS.toString());
            }

            if (options.SUMMARIZE.LEN) {
                args.push('LEN', options.SUMMARIZE.LEN.toString());
            }

            if (options.SUMMARIZE.SEPARATOR) {
                args.push('SEPARATOR', options.SUMMARIZE.SEPARATOR);
            }
        }
    }

    if (options?.HIGHLIGHT) {
        args.push('HIGHLIGHT');

        if (typeof options.HIGHLIGHT === 'object') {
            if (options.HIGHLIGHT.FIELDS) {
                args.push('FIELDS');
                pushVerdictArgument(args, options.HIGHLIGHT.FIELDS);
            }

            if (options.HIGHLIGHT.TAGS) {
                args.push('TAGS', options.HIGHLIGHT.TAGS.open, options.HIGHLIGHT.TAGS.close);
            }
        }
    }

    if (options?.SLOP) {
        args.push('SLOP', options.SLOP.toString());
    }

    if (options?.INORDER) {
        args.push('INORDER');
    }

    if (options?.LANGUAGE) {
        args.push('LANGUAGE', options.LANGUAGE);
    }

    if (options?.EXPANDER) {
        args.push('EXPANDER', options.EXPANDER);
    }

    if (options?.SCORER) {
        args.push('SCORER', options.SCORER);
    }

    // if (options?.EXPLAINSCORE) {
    //     args.push('EXPLAINSCORE');
    // }

    // if (options?.PAYLOAD) {
    //     args.push('PAYLOAD', options.PAYLOAD);
    // }

    if (options?.SORTBY) {
        args.push('SORTBY');
        pushSortByProperty(args, options.SORTBY);
    }

    // if (options?.MSORTBY) {
    //     pushSortByArguments(args, 'MSORTBY', options.MSORTBY);
    // }

    if (options?.LIMIT) {
        args.push(
            'LIMIT',
            options.LIMIT.from.toString(),
            options.LIMIT.size.toString()
        );
    }

    return args;
}

interface SearchDocumentValue {
    [key: string]: string | number | null | Array<SearchDocumentValue> | SearchDocumentValue;
}

export interface SearchReply {
    total: number;
    documents: Array<{
        id: string;
        value: SearchDocumentValue;
    }>;
}


export interface ProfileOptions {
    LIMITED?: true;
}

export type ProfileRawReply<T> = [
    results: T,
    profile: [
        _: string,
        TotalProfileTime: string,
        _: string,
        ParsingTime: string,
        _: string,
        PipelineCreationTime: string,
        _: string,
        IteratorsProfile: Array<any>
    ]
];

export interface ProfileReply {
    results: SearchReply | AGGREGATE.AggregateReply;
    profile: ProfileData;
}

interface ChildIterator {
    type?: string,
    counter?: number,
    term?: string,
    size?: number,
    time?: string,
    childIterators?: Array<ChildIterator>
}

interface IteratorsProfile {
    type?: string,
    counter?: number,
    queryType?: string,
    time?: string,
    childIterators?: Array<ChildIterator>
}

interface ProfileData {
    totalProfileTime: string,
    parsingTime: string,
    pipelineCreationTime: string,
    iteratorsProfile: IteratorsProfile
}

export function transformProfile(reply: Array<any>): ProfileData{
    return {
        totalProfileTime: reply[0][1],
        parsingTime: reply[1][1],
        pipelineCreationTime: reply[2][1],
        iteratorsProfile: transformIterators(reply[3][1])
    };
}

function transformIterators(IteratorsProfile: Array<any>): IteratorsProfile {
    var res: IteratorsProfile = {};
    for (let i = 0; i < IteratorsProfile.length; i += 2) {
        const value = IteratorsProfile[i+1];
        switch (IteratorsProfile[i]) {
            case 'Type':
                res.type = value;
                break;
            case 'Counter':
                res.counter = value;
                break;
            case 'Time':
                res.time = value;
                break;
            case 'Query type':
                res.queryType = value;
                break;
            case 'Child iterators':
                res.childIterators = value.map(transformChildIterators);
                break;
        }
    }

    return res;
}

function transformChildIterators(IteratorsProfile: Array<any>): ChildIterator {
    var res: ChildIterator = {};
    for (let i = 1; i < IteratorsProfile.length; i += 2) {
        const value = IteratorsProfile[i+1];
        switch (IteratorsProfile[i]) {
            case 'Type':
                res.type = value;
                break;
            case 'Counter':
                res.counter = value;
                break;
            case 'Time':
                res.time = value;
                break;
            case 'Size':
                res.size = value;
                break;
            case 'Term':
                res.term = value;
                break;
            case 'Child iterators':
                res.childIterators = value.map(transformChildIterators);
                break;
        }
    }

    return res;
}
