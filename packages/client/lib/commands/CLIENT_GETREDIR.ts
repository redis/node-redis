import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['CLIENT', 'GETREDIR'];
}

export declare function transformReply(): number;
