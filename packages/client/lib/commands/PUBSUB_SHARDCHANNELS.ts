import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    pattern?: RedisCommandArgument
): RedisCommandArguments {
    const args: RedisCommandArguments = ['PUBSUB', 'SHARDCHANNELS'];
    if (pattern) args.push(pattern);
    return args;
}

export declare function transformReply(): Array<RedisCommandArgument>;
