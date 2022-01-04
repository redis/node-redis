import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument | Array<RedisCommandArgument>,
    timeout: number
): RedisCommandArguments {
    const args = pushVerdictArguments(['BRPOP'], key);

    args.push(timeout.toString());

    return args;
}

export { transformReply } from './BLPOP';
