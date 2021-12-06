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
    const args = ['TS.MGET'];

    pushWithLabelsArgument(args, options?.SELECTED_LABELS);

    pushFilterArgument(args, filter);

    return args;
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
