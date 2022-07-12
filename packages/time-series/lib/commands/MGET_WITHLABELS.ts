import {
    SelectedLabels,
    pushWithLabelsArgument,
    Labels,
    transformLablesReply,
    transformSampleReply,
    Filter,
    pushFilterArgument
} from '.';
import { MGetRawReply, MGetReply } from './MGET';

export const IS_READ_ONLY = true;

interface MGetWithLabelsOptions {
    SELECTED_LABELS?: SelectedLabels;
}

export function transformArguments(
    filter: Filter,
    options?: MGetWithLabelsOptions
): Array<string> {
    const args = pushWithLabelsArgument(['TS.MGET'], options?.SELECTED_LABELS);
    return pushFilterArgument(args, filter);
}

export interface MGetWithLabelsReply extends MGetReply {
    labels: Labels;
};

export function transformReply(reply: MGetRawReply): Array<MGetWithLabelsReply> {
    return reply.map(([key, labels, sample]) => ({
        key,
        labels: transformLablesReply(labels),
        sample: transformSampleReply(sample)
    }));
}
