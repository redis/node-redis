export const IS_READ_ONLY = true;

export function transformArguments(index: string, query: string): Array<string> {
    return ['FT.EXPLAIN', index, query];
}

export declare function transformReply(): string;
