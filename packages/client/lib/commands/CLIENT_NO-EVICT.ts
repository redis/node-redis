import { RedisCommandArguments } from '.';

export function transformArguments(value: boolean): RedisCommandArguments {
    return [
        'CLIENT',
        'NO-EVICT',
        value ? 'ON' : 'OFF'
    ];
}

export declare function transformReply(): 'OK' | Buffer;
