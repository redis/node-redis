export const IS_READ_ONLY = true;

interface ProfileOptions {
    LIMITED?: true;
}

export function transformArguments(
    index: string,
    type: 'SEARCH' | 'AGGREGATE',
    query: string,
    options?: ProfileOptions
): Array<string> {
    const args = ['FT.PROFILE', index, type];

    if (options?.LIMITED) {
        args.push('LIMITED');
    }

    args.push('QUERY', query);

    return args;
}

export function transformReply() {
    
}
