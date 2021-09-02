export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['LASTSAVE'];
}

export function transformReply(reply: number): Date {
    return new Date(reply);
}
