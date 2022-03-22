import { RedisCommandArguments } from '.';
import { transformZMPopArguments, ZMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 3;

export function transformArguments(
    timeout: number,
    keys: string | Array<string>,
    options: ZMPopOptions
): RedisCommandArguments {
    return transformZMPopArguments(['BZMPOP', timeout.toString()], keys, options);
}

export { transformReply } from './ZMPOP';
