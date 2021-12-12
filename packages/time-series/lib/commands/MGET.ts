import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { Filter, pushFilterArgument, RawLabels, SampleRawReply, SampleReply, transformSampleReply } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(filter: Filter): RedisCommandArguments {
    return pushFilterArgument(['TS.MGET'], filter);
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
