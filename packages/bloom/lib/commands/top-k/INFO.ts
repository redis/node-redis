export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['TOPK.INFO', key];
}

export type InfoRawReply = [
    _: string,
    K: number,
    _: string,
    width: number,
    _: string,
    depth: number,
    _: string,
    decay: string,
];

export interface InfoReply {
    k: number,
    width: number;
    depth: number;
    decay: string;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        k: reply[1],
        width: reply[3],
        depth: reply[5],
        decay: reply[7]
    };
}
