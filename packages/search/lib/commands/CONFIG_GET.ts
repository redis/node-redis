export function transformArguments(option: string) {
    return ['FT.CONFIG', 'GET', option];
}

interface ConfigGetReply {
    [option: string]: string | null;
}

export function transformReply(rawReply: Array<[string, string | null]>): ConfigGetReply {
    const transformedReply: ConfigGetReply = Object.create(null);
    for (const [key, value] of rawReply) {
        transformedReply[key] = value;
    }

    return transformedReply;
}
