export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['RANDOMKEY'];
}

export function transformReply(reply: string | null): string | null {
    return reply;
}
