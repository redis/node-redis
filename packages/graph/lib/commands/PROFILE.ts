export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, query: string): Array<string> {
    return ['GRAPH.PROFILE', key, query];
}

export declare function transfromReply(): Array<string>;
