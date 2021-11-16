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

export declare function transformReply(): string;
