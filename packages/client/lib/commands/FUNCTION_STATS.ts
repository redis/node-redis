import { RedisCommandArguments } from '.';
import { RedisFunctionEngines } from './FUNCTION_LOAD';

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
    Array<[
        RedisFunctionEngines,
        [
            'libraries_count',
            number,
            'functions_count',
            number
        ]
    ]>
];

interface FunctionStatsReply {
    runningScript: null | {
        name: string;
        command: string;
        durationMs: number;
    };
    engines: Array<{
        engine: RedisFunctionEngines;
        librariesCount: number;
        functionsCount: number;
    }>;
}

export function transformReply(reply: FunctionStatsRawReply): FunctionStatsReply {
    return {
        runningScript: reply[1] === null ? null : {
            name: reply[1][1],
            command: reply[1][3],
            durationMs: reply[1][5]
        },
        engines: reply[3].map(([engine, data]) => ({
            engine,
            librariesCount: data[1],
            functionsCount: data[3]
        }))
    };
}
