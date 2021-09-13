import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['SDIFFSTORE', destination], keys);
}

export const transformReply = transformReplyNumber;
