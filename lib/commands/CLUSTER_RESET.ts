export type ClusterResetModes = 'HARD' | 'SOFT';

export function transformArguments(mode?: ClusterResetModes): Array<string> {
    const args = ['CLUSTER', 'RESET'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): string;
