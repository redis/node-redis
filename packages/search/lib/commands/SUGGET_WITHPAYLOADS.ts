import { SugGetOptions, transformArguments as transformSugGetArguments } from './SUGGET';

export { IS_READ_ONLY } from './SUGGET';

export function transformArguments(key: string, prefix: string, options?: SugGetOptions): Array<string> {
    return [
        ...transformSugGetArguments(key, prefix, options),
        'WITHPAYLOADS'
    ];
}

export interface SuggestionWithPayload {
    suggestion: string;
    payload: string | null;
}

export function transformReply(rawReply: Array<string | null> | null): Array<SuggestionWithPayload> | null {
    if (rawReply === null) return null;

    const transformedReply = [];
    for (let i = 0; i < rawReply.length; i += 2) {
        transformedReply.push({
            suggestion: rawReply[i]!,
            payload: rawReply[i + 1]
        });
    }

    return transformedReply;
}
