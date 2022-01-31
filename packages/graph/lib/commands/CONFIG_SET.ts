export function transformArguments(configKey: string, value: number): Array<string> {
    return [
        'GRAPH.CONFIG',
        'SET',
        configKey,
        value.toString()
    ];
}

export declare function transformReply(): 'OK';
