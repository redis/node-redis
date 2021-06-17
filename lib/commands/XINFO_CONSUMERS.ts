export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, group: string): Array<string> {
    return ['XINFO', 'CONSUMERS', key, group];
}

type XInfoConsumersReply = Array<{
    name: string;
    pending: number;
    idle: number;
}>;

export function transformReply(rawReply: Array<any>): XInfoConsumersReply {
    return rawReply.map(consumer => ({
        name: consumer[1],
        pending: consumer[3],
        idle: consumer[5]
    }));
}
