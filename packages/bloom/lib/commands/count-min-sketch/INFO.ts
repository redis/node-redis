export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['CMS.INFO', key];
}

export type InfoRawReply = [
    _: string,
    width: number,
    _: string,
    depth: number,
    _: string,
    count: number
];

export interface InfoReply {
    width: number;
    depth: number;
    count: number;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        width: reply[1],
        depth: reply[3],
        count: reply[5]
    };
}
