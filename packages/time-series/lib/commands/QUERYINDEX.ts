export const IS_READ_ONLY = true;

export function transformArguments(query: string): Array<string> {
    return ['TS.QUERYINDEX', query];
}

export declare function transformReply(): Array<string>;
