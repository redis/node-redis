import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['CLIENT', 'GETNAME'];
}

export declare function transformReply(): string | null;
