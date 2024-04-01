import { ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["LATENCY", "LATEST"];
}

export declare function transformReply(): Array<
  [
    name: string,
    timestamp: number,
    latestLatency: number,
    allTimeLatency: number
  ]
>;
