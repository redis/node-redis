import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushOptionalVerdictArgument, pushVerdictArgument, transformReplyTuples } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisSearchLanguages, PropertyName, pushSortByArguments, SortByOptions } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface SearchOptions {
    // NOCONTENT?: true; TODO
    VERBATIM?: true;
    NOSTOPWORDS?: true;
    // WITHSCORES?: true;
    // WITHPAYLOADS?: true;
    WITHSORTKEYS?: true;
    // FILTER?: {
    //     field: string;
    //     min: number | string;
    //     max: number | string;
    // };
    // GEOFILTER?: {
    //     field: string;
    //     lon: number;
    //     lat: number;
    //     radius: number;
    //     unit: 'm' | 'km' | 'mi' | 'ft';
    // };
    INKEYS?: string | Array<string>;
    INFIELDS?: string | Array<string>;
    RETURN?: string | Array<string>;
    SUMMARIZE?: true | {
        FIELDS?: PropertyName | Array<PropertyName>;
        FRAGS?: number;
        LEN?: number;
        SEPARATOR?: string;
    };
    HIGHLIGHT?: true | {
        FIELDS?: PropertyName | Array<PropertyName>;
        TAGS?: {
            open: string;
            close: string;
        };
    };
    SLOP?: number;
    INORDER?: true;
    LANGUAGE?: RedisSearchLanguages;
    EXPANDER?: string;
    SCORER?: string;
    // EXPLAINSCORE?: true; // TODO: WITHSCORES
    // PAYLOAD?: ;
    // SORTBY?: SortByOptions;
    MSORTBY?: SortByOptions | Array<SortByOptions>;
    LIMIT?: {
        from: number | string;
        size: number | string;
    };
}

export function transformArguments(
    index: string,
    query: string,
    options?: SearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = ['FT.SEARCH', index, query];

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

    // if (options?.SORTBY) {
    //     args.push('SORTBY');
    //     pushSortByArguments(args, options.SORTBY);
    // }

    if (options?.MSORTBY) {
        pushSortByArguments(args, 'MSORTBY', options.MSORTBY);
    }

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

interface SearchReply {
    total: number;
    documents: Array<{
        id: string;
        value: SearchDocumentValue;
    }>;
}

export function transformReply(reply: Array<any>): SearchReply {
    const documents = [];
    for (let i = 1; i < reply.length; i += 2) {
        const tuples = reply[i + 1];
        documents.push({
            id: reply[i],
            value: tuples.length === 2 && tuples[0] === '$' ?
                JSON.parse(tuples[1]) :
                transformReplyTuples(tuples)
        });
    }

    return {
        total: reply[0],
        documents
    };
}
