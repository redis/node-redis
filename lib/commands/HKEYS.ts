export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['HKEYS', key];
}

export function transformReply(reply: Array<string>): Array<string> {
    return reply;
}
