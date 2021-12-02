import { Labels, MGetRawReply, pushWithLabelsArgument, SelectedLabels, transformLablesReply, transformSampleReply } from '.';
import { MGetReply } from './MGET';

export const IS_READ_ONLY = true;

export interface MGetWithLabelsReply extends MGetReply{
    labels: Labels
}

export function transformArguments(filters: Array<string>, options?: SelectedLabels): Array<string> {
    const args = ['TS.MGET'];
    pushWithLabelsArgument(args, options?.SELECTED_LABELS);
    args.push('FILTER', ...filters);

    return args;
}

export function transformReply(reply: MGetRawReply): Array<MGetWithLabelsReply> {
    const args = []

    for (const [key, labels, sample] of reply) {
        args.push({
            key,
            labels: transformLablesReply(labels),
            sample: transformSampleReply(sample)
        });
    }

    return args;
}
