import { RedisCommandArguments } from '.';

export function transformArguments(value: boolean): RedisCommandArguments {
    return [
        'CLIENT',
        'CACHING',
        value ? 'YES' : 'NO'
    ];
}

export declare function transformReply(): 'OK' | Buffer;
