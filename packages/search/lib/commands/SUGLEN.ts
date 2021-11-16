export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['FT.SUGLEN', key];
}

export declare function transformReply(): number;
