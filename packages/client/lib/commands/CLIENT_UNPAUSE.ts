import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['CLIENT', 'UNPAUSE'];
}

export declare function transformReply(): 'OK' | Buffer;
