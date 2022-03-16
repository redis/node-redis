export function transformArguments(
    parameter: string,
    value: string,
    mulitipleParams?: Array<[parameter: string, value: string]>
): Array<string> {
    const args = ['CONFIG', 'SET', parameter, value];

    if (mulitipleParams) {
        mulitipleParams.forEach(pair => args.push(pair[0], pair[1]));
    }

    return args;
}

export declare function transformReply(): string;
