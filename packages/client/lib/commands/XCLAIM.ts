import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export interface XClaimOptions {
    IDLE?: number;
    TIME?: number | Date;
    RETRYCOUNT?: number;
    FORCE?: true;
}

export function transformArguments(
    key: string,
    group: string,
    consumer: string,
    minIdleTime: number,
    id: string | Array<string>,
    options?: XClaimOptions
): Array<string> {
    const args = ['XCLAIM', key, group, consumer, minIdleTime.toString()];

    pushVerdictArguments(args, id);

    if (options?.IDLE) {
        args.push('IDLE', options.IDLE.toString());
    }

    if (options?.TIME) {
        args.push(
            'TIME',
            (typeof options.TIME === 'number' ? options.TIME : options.TIME.getTime()).toString()
        );
    }

    if (options?.RETRYCOUNT) {
        args.push('RETRYCOUNT', options.RETRYCOUNT.toString());
    }

    if (options?.FORCE) {
        args.push('FORCE');
    }

    return args;
}

export { transformReplyStreamMessages as transformReply } from './generic-transformers';
