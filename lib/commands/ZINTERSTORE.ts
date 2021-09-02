import { pushVerdictArgument, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface ZInterStoreOptions {
    WEIGHTS?: Array<number>;
    AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export function transformArguments(destination: string, keys: Array<string> | string, options?: ZInterStoreOptions): Array<string> {
    const args = pushVerdictArgument(['ZINTERSTORE', destination], keys);

    if (options?.WEIGHTS) {
        args.push(
            'WEIGHTS',
            ...options.WEIGHTS.map(weight => weight.toString())
        );
    }

    if (options?.AGGREGATE) {
        args.push('AGGREGATE', options?.AGGREGATE);
    }

    return args;
}

export const transformReply = transformReplyNumber;
