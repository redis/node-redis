import { RedisCommandArguments } from '.';

export function transformArguments(library: string): RedisCommandArguments {
    return ['FUNCTION', 'DELETE', library];
}

export declare function transformReply(): 'OK';
