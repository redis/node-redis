
export const IS_READ_ONLY = true;

export function transformArguments(key: string, index: number): Array<string> {
    return ['LINDEX', key, index.toString()];
}

export declare function transformReply(): string | null;