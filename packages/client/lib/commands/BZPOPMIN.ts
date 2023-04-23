import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVariadicArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument | Array<RedisCommandArgument>,
    timeout: number
): RedisCommandArguments {
    const args = pushVariadicArguments(['BZPOPMIN'], key);

    args.push(timeout.toString());

    return args;
}

export { transformReply } from './BZPOPMAX';
