import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export function transformArguments(keys: string | Array<string>): Array<string> {
    return pushVerdictArguments(['DEL'], keys);
}

export const transformReply = transformReplyNumber;
