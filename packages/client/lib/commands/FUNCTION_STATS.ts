import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['FUNCTION', 'STATS'];
}

type FunctionStatsRawReply = [
    'running_script',
    null | [
        'name',
        string,
        'command',
        string,
        'duration_ms',
        number
    ],
    'engines',
    Array<any> // "flat tuples" (there is no way to type that)
    // ...[string, [
    //     'libraries_count',
    //     number,
    //     'functions_count',
    //     number
    // ]]
];

interface FunctionStatsReply {
    runningScript: null | {
        name: string;
        command: string;
        durationMs: number;
    };
    engines: Record<string, {
        librariesCount: number;
        functionsCount: number;
    }>;
}

export function transformReply(reply: FunctionStatsRawReply): FunctionStatsReply {
    const engines = Object.create(null);
    for (let i = 0; i < reply[3].length; i++) {
        engines[reply[3][i]] = {
            librariesCount: reply[3][++i][1],
            functionsCount: reply[3][i][3]
        };
    }

    return {
        runningScript: reply[1] === null ? null : {
            name: reply[1][1],
            command: reply[1][3],
            durationMs: reply[1][5]
        },
        engines
    };
}
