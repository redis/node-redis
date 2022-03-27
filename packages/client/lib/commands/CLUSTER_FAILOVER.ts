export enum FailoverModes {
    FORCE = 'FORCE',
    TAKEOVER = 'TAKEOVER'
}

export function transformArguments(mode?: FailoverModes): Array<string> {
    const args = ['CLUSTER', 'FAILOVER'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): 'OK';
