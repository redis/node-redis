import { MGetRawReply, SampleReply, transformSampleReply } from '.';

export const IS_READ_ONLY = true;

export interface MGetReply {
    key: string,
    sample: SampleReply
}

export function transformArguments(filters: Array<string>): Array<string> {
    return ['TS.MGET','FILTER', ...filters];
}

export function transformReply(reply: MGetRawReply): Array<MGetReply> {
    const args = []

    for (const [key, _, sample] of reply) {
        args.push({
            key,
            sample: transformSampleReply(sample)
        });
    }

    return args;
}
