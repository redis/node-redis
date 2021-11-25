export function transformArguments(channel: string, message: string): Array<string> {
    return ['PUBLISH', channel, message];
}

export declare function transformReply(): number;
