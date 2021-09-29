export const IS_READ_ONLY = true;

export function transformArguments(pattern?: string): Array<string> {
    const args = ['PUBSUB', 'CHANNELS'];

    if (pattern) {
        args.push(pattern);
    }

    return args;
}

export declare function transformReply(): Array<string>;
