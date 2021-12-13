import { SampleRawReply, SampleReply, transformSampleReply } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['TS.GET', key];
}

export function transformReply(reply: [] | SampleRawReply): null | SampleReply {
    if (reply.length === 0) return null;

    return transformSampleReply(reply);
}
