import { StreamMessageReply, transformReplyStreamMessage } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['XINFO', 'STREAM', key];
}

interface XInfoStreamReply {
    length: number;
    radixTreeKeys: number;
    radixTreeNodes: number;
    groups: number;
    lastGeneratedId: string;
    firstEntry: StreamMessageReply | null;
    lastEntry: StreamMessageReply | null;
};

export function transformReply(reply: Array<any>): XInfoStreamReply {
    return {
        length: reply[1],
        radixTreeKeys: reply[3],
        radixTreeNodes: reply[5],
        lastGeneratedId: reply[7],
        groups: reply[9],
        firstEntry: reply[11] ? {
            id: reply[11][0] ?? null,
            message: transformReplyStreamMessage(reply[11][1])
        } : null,
        lastEntry: reply[13] ? {
            id: reply[13][0],
            message: transformReplyStreamMessage(reply[13][1])
        } : null
    };
}
