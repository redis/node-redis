import { RedisCommandArguments } from '.';

export function transformArguments(name: string): RedisCommandArguments {
    return ['CLIENT', 'SETNAME', name];
}

export declare function transformReply(): string | null;
