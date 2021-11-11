export function transformArguments(option: string, value: string): Array<string> {
    return ['FT.CONFIG', 'SET', option, value];
}

export declare function transformReply(): 'OK';
