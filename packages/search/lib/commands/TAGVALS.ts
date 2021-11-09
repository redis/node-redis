export function transformArguments(index: string, fieldName: string): Array<string> {
    return ['FT.TAGVALS', index, fieldName];
}

export declare function transformReply(): Array<string>;
