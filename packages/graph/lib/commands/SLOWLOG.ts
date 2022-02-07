export const IS_READ_ONLY = true;

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string) {
    return ['GRAPH.SLOWLOG', key];
}

type SlowLogRawReply = Array<[
    timestamp: string,
    command: string,
    query: string,
    took: string
]>;

type SlowLogReply = Array<{
    timestamp: Date;
    command: string;
    query: string;
    took: number;
}>;

export function transformReply(logs: SlowLogRawReply): SlowLogReply {
    return logs.map(([timestamp, command, query, took]) => ({
        timestamp: new Date(Number(timestamp) * 1000),
        command,
        query,
        took: Number(took)
    }));
}
