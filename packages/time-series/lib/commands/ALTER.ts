import { pushRetentionArgument, Labels, pushLabelsArgument } from '.';

export const FIRST_KEY_INDEX = 1;

interface AlterOptions {
    RETENTION?: number;
    LABELS?: Labels;
}

export function transformArguments(key: string, options?: AlterOptions): Array<string> {
    const args = ['TS.ALTER', key];

    pushRetentionArgument(args, options?.RETENTION);

    pushLabelsArgument(args, options?.LABELS);

    return args;
}

export declare function transformReply(): 'OK';
