import { RedisCommandArguments } from '.';

export interface latenctStats{
    event : string,
    timestamp: number,
    latestLatency: number,
    allTimeLatency: number
}

export function transformArguments(): RedisCommandArguments {
    return ['LATENCY', 'LATEST'];
}

export declare function transformReply(): Array<latenctStats>;
