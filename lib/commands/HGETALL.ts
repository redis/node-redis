export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['HGETALL', key];
}

export function transformReply(reply: Array<string>): Record<string, string> {
    const obj = Object.create(null);
    for (let i = 0; i < reply.length; i += 2) {
        obj[reply[i]] = reply[i + 1];
    }

    return obj;
}
