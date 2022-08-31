import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushLatestArgument, SampleRawReply, SampleReply, transformSampleReply } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface GetOptions {
    LATEST?: boolean;
}

export function transformArguments(key: string, options?: GetOptions): RedisCommandArguments {
    return pushLatestArgument(['TS.GET', key], options?.LATEST);
}

export function transformReply(reply: [] | SampleRawReply): null | SampleReply {
    if (reply.length === 0) return null;

    return transformSampleReply(reply);
}
