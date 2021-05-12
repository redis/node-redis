export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string): Array<string> {
    return ['HGET', key, field];
}

export function transformReply(reply?: string): string | undefined {
    return reply;
}
