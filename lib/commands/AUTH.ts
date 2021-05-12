import { transformReplyString } from './generic-transformers';

export interface AuthOptions {
    username?: string;
    password: string;
}

export function transformArguments({username, password}: AuthOptions): Array<string> {
    if (!username) {
        return ['AUTH', password];
    }

    return ['AUTH', username, password];
}

export const transformReply = transformReplyString;
