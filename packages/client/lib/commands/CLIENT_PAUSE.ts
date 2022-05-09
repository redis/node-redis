import { RedisCommandArguments } from '.';

export function transformArguments(
    timeout: number,
    mode: 'WRITE' | 'ALL'
): RedisCommandArguments {
    return [
        'CLIENT',
        'PAUSE',
        timeout.toString(),
        mode
    ];
}

export declare function transformReply(): 'OK' | Buffer;
