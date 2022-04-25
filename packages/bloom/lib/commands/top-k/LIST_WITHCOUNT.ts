export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['TOPK.LIST', key, 'WITHCOUNT'];
}

type ListWithCountRawReply = Array<string | number>;

type ListWithCountReply = Array<{
    item: string,
    count: number
}>;

export function transformReply(rawReply: ListWithCountRawReply): ListWithCountReply {
    const reply: ListWithCountReply = [];
    for (let i = 0; i < rawReply.length; i++) {
        reply.push({
            item: rawReply[i] as string,
            count: rawReply[++i] as number
        });
    }

    return reply;
}