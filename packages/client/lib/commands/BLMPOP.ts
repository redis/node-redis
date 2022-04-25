import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformLMPopArguments, LMPopOptions, ListSide } from './generic-transformers';

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
    timeout: number,
    keys: RedisCommandArgument | Array<RedisCommandArgument>,
    side: ListSide,
    options?: LMPopOptions
): RedisCommandArguments {
    return transformLMPopArguments(
        ['BLMPOP', timeout.toString()],
        keys,
        side,
        options
    );
}

export { transformReply } from './LMPOP';
