import { SearchOptions, SearchRawReply, transformReply as transformSearchReply } from './SEARCH';
import { pushSearchOptions, ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from '.';
import { RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const IS_READ_ONLY = true;

export function transformArguments(
    index: string,
    query: string,
    options?: ProfileOptions & SearchOptions
): RedisCommandArguments {
    let args: RedisCommandArguments = ['FT.PROFILE', index, 'SEARCH'];

    if (options?.LIMITED) {
        args.push('LIMITED');
    }

    args.push('QUERY', query);
    return pushSearchOptions(args, options);
}

type ProfileSearchRawReply = ProfileRawReply<SearchRawReply>;

export function transformReply(reply: ProfileSearchRawReply, withoutDocuments: boolean): ProfileReply {
    return {
        results: transformSearchReply(reply[0], withoutDocuments),
        profile: transformProfile(reply[1])
    };
}
