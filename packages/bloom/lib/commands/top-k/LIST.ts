export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['TOPK.LIST', key];
}

export declare function transformReply(): Array<string | null>;
