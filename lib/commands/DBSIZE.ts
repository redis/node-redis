export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['DBSIZE'];
}

export declare function transformReply(): number;
