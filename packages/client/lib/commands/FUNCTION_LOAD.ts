import { RedisCommandArguments } from '.';

export enum RedisFunctionEngines {
    LUA = 'LUA'
}

export enum RedisFunctionFlags {
    NO_WRITES = 'no-writes'
}

interface FunctionLoadOptions {
    REPLACE?: boolean;
    DESCRIPTION?: string;
}

export function transformArguments(
    engine: RedisFunctionEngines,
    library: string,
    code: string,
    options?: FunctionLoadOptions
): RedisCommandArguments {
    const args = ['FUNCTION', 'LOAD', engine, library];

    if (options?.REPLACE) {
        args.push('REPLACE');
    }

    if (options?.DESCRIPTION) {
        args.push('DESCRIPTION', options.DESCRIPTION);
    }

    args.push(code);

    return args;
}

export declare function transformReply(): 'OK';
