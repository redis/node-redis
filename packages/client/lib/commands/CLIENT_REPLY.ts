import { RedisCommandArguments } from '.';

export function transformArguments(
    mode: 'ON' | 'OFF' | 'SKIP'
): RedisCommandArguments {
    return [
        'CLIENT',
        'REPLY',
        mode
    ];
}

export declare function transformReply(): null | 'OK';
