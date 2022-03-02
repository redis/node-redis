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
        string // TODO: number?
    ],
    'engines',
    Array<[
        string
    ]>
];
