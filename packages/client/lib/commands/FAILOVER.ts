interface FailoverOptions {
    TO?: {
        host: string;
        port: number;
        FORCE?: true;
    };
    ABORT?: true;
    TIMEOUT?: number;
}

export function transformArguments(options?: FailoverOptions): Array<string> {
    const args = ['FAILOVER'];

    if (options?.TO) {
        args.push('TO', options.TO.host, options.TO.port.toString());

        if (options.TO.FORCE) {
            args.push('FORCE');
        }
    }

    if (options?.ABORT) {
        args.push('ABORT');
    }

    if (options?.TIMEOUT) {
        args.push('TIMEOUT', options.TIMEOUT.toString());
    }

    return args;
}

export declare function transformReply(): string;
