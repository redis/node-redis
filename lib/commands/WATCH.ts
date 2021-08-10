import { pushVerdictArguments, transformReplyString } from './generic-transformers';

export function transformArguments(key: string | Array<string>): Array<string> {
    return pushVerdictArguments(['WATCH'], key);
}

export const transformReply = transformReplyString;
