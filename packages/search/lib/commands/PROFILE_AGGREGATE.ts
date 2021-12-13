import { pushAggregatehOptions, AggregateOptions, transformReply as transformAggregateReply, AggregateRawReply } from './AGGREGATE';
import { ProfileOptions, ProfileRawReply, ProfileReply, transformProfile } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    index: string,
    query: string,
    options?: ProfileOptions & AggregateOptions
): Array<string> {
    const args = ['FT.PROFILE', index, 'AGGREGATE'];

    if (options?.LIMITED) {
        args.push('LIMITED');
    }

    args.push('QUERY', query);
    pushAggregatehOptions(args, options)
    return args;
}

type ProfileAggeregateRawReply = ProfileRawReply<AggregateRawReply>;

export function transformReply(reply: ProfileAggeregateRawReply): ProfileReply {
    return {
        results: transformAggregateReply(reply[0]),
        profile: transformProfile(reply[1])
    };
}
