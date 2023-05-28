import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['LATENCY', 'LATEST'];
}

export declare function transformReply(): Array<[
    name: string,
    timestamp: number,
    latestLatency: number,
    allTimeLatency: number
]>;
