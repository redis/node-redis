export const FIRST_KEY_INDEX = 1;

export function transformArguments(index: string): Array<string> {
    return ['FT.SYNDUMP', index];
}

export declare function transformReply(): Array<string>;
