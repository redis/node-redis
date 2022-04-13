import { RedisCommandArguments } from '.';

interface FunctionLoadOptions {
    REPLACE?: boolean;
}

export function transformArguments(
    code: string,
    options?: FunctionLoadOptions
): RedisCommandArguments {
    const args = ['FUNCTION', 'LOAD'];

    if (options?.REPLACE) {
        args.push('REPLACE');
    }

    args.push(code);

    return args;
}

export declare function transformReply(): string;
