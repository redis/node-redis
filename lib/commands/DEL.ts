import { TransformArgumentsReply } from '.';
import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export function transformArguments(keys: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['DEL'], keys);
}

export const transformReply = transformReplyNumber;
