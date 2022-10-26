import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { Filter, pushFilterArgument, pushLatestArgument, RawLabels, SampleRawReply, SampleReply, transformSampleReply } from '.';

export const IS_READ_ONLY = true;

export interface MGetOptions {
    LATEST?: boolean;
}

export function transformArguments(filter: Filter, options?: MGetOptions): RedisCommandArguments {
    const args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    return pushFilterArgument(args, filter);
}

export type MGetRawReply = Array<[
    key: string,
    labels: RawLabels,
    sample: SampleRawReply
]>;

export interface MGetReply {
    key: string,
    sample: SampleReply
}

export function transformReply(reply: MGetRawReply): Array<MGetReply> {
    return reply.map(([key, _, sample]) => ({
        key,
        sample: transformSampleReply(sample)
    }));
}
