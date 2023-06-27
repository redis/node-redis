import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    const args: RedisCommandArguments = ['CLUSTER', 'MYSHARDID'];

    return args;
}

export declare function transformReply(): RedisCommandArgument;
