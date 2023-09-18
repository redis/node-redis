import { RedisCommandArguments } from "@redis/client/dist/lib/commands";
import { pushSearchOptions } from ".";
import { SearchOptions, SearchRawReply } from "./SEARCH";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    index: string,
    query: string,
    options?: SearchOptions
): RedisCommandArguments {
    return pushSearchOptions(
        ['FT.SEARCH', index, query, 'NOCONTENT'],
        options
    );
}

export interface SearchNoContentReply {
    total: number;
    documents: Array<string>;
};

export function transformReply(reply: SearchRawReply): SearchNoContentReply {
    return {
        total: reply[0],
        documents: reply.slice(1)
    };
}
