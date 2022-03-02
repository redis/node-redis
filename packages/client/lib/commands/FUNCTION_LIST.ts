import { RedisCommandArguments } from '.';
import { RedisFunctionEngines, RedisFunctionFlags } from './FUNCTION_LOAD';

export function transformArguments(pattern?: string): RedisCommandArguments {
    const args = ['FUNCTION', 'LIST'];

    if (pattern) {
        args.push(pattern);
    }

    return args;
}

export type FunctionListRawReply = [
    'library_name',
    string,
    'engine',
    RedisFunctionEngines,
    'description',
    string,
    'functions',
    Array<[
        'name',
        string,
        'description',
        string | null,
        'flags',
        Array<RedisFunctionFlags>
    ]>
];

export interface FunctionListReply {
    libraryName: string,
    engine: RedisFunctionEngines,
    description: string,
    functions: Array<{
        name: string;
        description: string | null;
        flags: Array<RedisFunctionFlags>;
    }>;
}

export function transformReply(reply: FunctionListRawReply): FunctionListReply {
    return {
        libraryName: reply[1],
        engine: reply[3],
        description: reply[5],
        functions: reply[7].map(fn => ({
            name: fn[1],
            description: fn[3],
            flags: fn[5]
        }))
    };
}
