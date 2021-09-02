import { pushVerdictArgument, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: Array<string> | string): Array<string> {
    return pushVerdictArgument(['ZDIFFSTORE', destination], keys);
}

export const transformReply = transformReplyNumber;
