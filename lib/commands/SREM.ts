import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, members: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['SREM', key], members);
}

export const transformReply = transformReplyNumber;
