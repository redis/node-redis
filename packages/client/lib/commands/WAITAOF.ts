import { RedisCommandArguments } from '.';

export function transformArguments(
    numlocal: number,
    numreplicas: number,
    timeout: number
): RedisCommandArguments {
    return [
        'WAITAOF',
        numlocal.toString(),
        numreplicas.toString(),
        timeout.toString()
    ];
}

export declare function transformReply(): Array<[number, number]>;
