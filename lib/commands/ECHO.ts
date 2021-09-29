export const IS_READ_ONLY = true;

export function transformArguments(message: string): Array<string> {
    return ['ECHO', message];
}

export declare function transformReply(): string;
