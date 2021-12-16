import { RedisCommandArgument, RedisCommandArguments } from '.';
import { StreamStringsMessageReply, transformReplyStringTuples } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['XINFO', 'STREAM', key];
}

interface XInfoStreamReply {
    length: number;
    radixTreeKeys: number;
    radixTreeNodes: number;
    groups: number;
    lastGeneratedId: string;
    firstEntry: StreamStringsMessageReply | null;
    lastEntry: StreamStringsMessageReply | null;
}

export function transformReply(rawReply: Array<any>): XInfoStreamReply {
    const parsedReply: Partial<XInfoStreamReply> = {};

    for (let i = 0; i < rawReply.length; i+= 2) {
        switch (rawReply[i]) {
            case 'length':
                parsedReply.length = rawReply[i + 1];
                break;

            case 'radix-tree-keys':
                parsedReply.radixTreeKeys = rawReply[i + 1];
                break;

            case 'radix-tree-nodes':
                parsedReply.radixTreeNodes = rawReply[i + 1];
                break;

            case 'groups':
                parsedReply.groups = rawReply[i + 1];
                break;

            case 'last-generated-id':
                parsedReply.lastGeneratedId = rawReply[i + 1];
                break;

            case 'first-entry':
                parsedReply.firstEntry = rawReply[i + 1] ? {
                    id: rawReply[i + 1][0],
                    message: transformReplyStringTuples(rawReply[i + 1][1])
                } : null;
                break;

            case 'last-entry':
                parsedReply.lastEntry = rawReply[i + 1] ? {
                    id: rawReply[i + 1][0],
                    message: transformReplyStringTuples(rawReply[i + 1][1])
                } : null;
                break;
        }
    }

    return parsedReply as XInfoStreamReply;
}
