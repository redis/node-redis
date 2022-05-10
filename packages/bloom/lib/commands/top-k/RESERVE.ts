export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface ReserveOptions {
    width: number;
    depth: number;
    decay: number;
}

export function transformArguments(
    key: string,
    topK: number,
    options?: ReserveOptions
): Array<string> {
    const args = ['TOPK.RESERVE', key, topK.toString()];

    if (options) {
        args.push(
            options.width.toString(),
            options.depth.toString(),
            options.decay.toString()
        );
    }

    return args;
}

export declare function transformReply(): 'OK';
