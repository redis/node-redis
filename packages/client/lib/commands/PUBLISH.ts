import { RedisCommandArguments } from '.';

export function transformArguments(channel: string | Buffer, message: string | Buffer): RedisCommandArguments {
    return ['PUBLISH', channel, message];
}

export declare function transformReply(): number;
