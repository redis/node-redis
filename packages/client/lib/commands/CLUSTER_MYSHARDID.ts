export const IS_READ_ONLY = true;

export function transformArguments() {
    return ['CLUSTER', 'MYSHARDID'];
}

export declare function transformReply(): string | Buffer;
