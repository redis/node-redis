export function transformArguments(parameter: string, value: string): Array<string> {
    return ['CONFIG', 'SET', parameter, value];
}

export declare function transformReply(): string;
