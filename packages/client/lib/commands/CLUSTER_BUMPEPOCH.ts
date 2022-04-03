export function transformArguments(): Array<string> {
    return ['CLUSTER', 'BUMPEPOCH'];
}

export declare function transformReply(): 'BUMPED' | 'STILL';
