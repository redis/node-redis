import { pushVerdictArgument, pushVerdictArguments } from '@node-redis/client/lib/commands/generic-transformers';

export const IS_READ_ONLY = true;

interface WithLabels {
    WITHLABELS: true;
}

interface SelectedLabels {
    SELECTED_LABELS: string | Array<string>;
}

type MGetOptions = WithLabels & SelectedLabels;

export function transformArguments(filter: string, options?: MGetOptions): Array<string> {
    const args = ['TS.MGET'];

    if (options?.WITHLABELS) {
        args.push('WITHLABELS');
    } else if (options?.SELECTED_LABELS) {
        pushVerdictArguments(args, options.SELECTED_LABELS);
    }

    args.push('FILTER', filter);

    return args;
}

export function transformReply() {

}
