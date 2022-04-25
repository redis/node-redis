import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['FUNCTION', 'KILL'];
}

export declare function transformReply(): 'OK';
