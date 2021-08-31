import { RedisReply } from './';

export function transformArguments(): Array<string> {
    return ['EXEC'];
}

export function transformReply(reply: Array<RedisReply>): Array<RedisReply> {
    return reply;
}
