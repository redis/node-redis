export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, group: string): Array<string> {
    return ['XPENDING', key, group];
}

interface XPendingReply {
    pending: number;
    firstId: string | null;
    lastId: number | null
    consumers: Array<string> | null;
}

export function transformReply(reply: [number, string | null, number | null, Array<string> | null]): XPendingReply {
    return {
        pending: reply[0],
        firstId: reply[1],
        lastId: reply[2],
        consumers: reply[3]
    };
}
