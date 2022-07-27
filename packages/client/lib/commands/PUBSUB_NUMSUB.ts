import { pushVerdictArguments } from './generic-transformers';
import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    channels?: Array<RedisCommandArgument> | RedisCommandArgument
): RedisCommandArguments {
    const args = ['PUBSUB', 'NUMSUB'];

    if (channels) return pushVerdictArguments(args, channels);

    return args;
}

export function transformReply(rawReply: Array<string | number>): Record<string, number> {
    const transformedReply = Object.create(null);

    for (let i = 0; i < rawReply.length; i +=2) {
        transformedReply[rawReply[i]] = rawReply[i + 1];
    }

    return transformedReply;
}
