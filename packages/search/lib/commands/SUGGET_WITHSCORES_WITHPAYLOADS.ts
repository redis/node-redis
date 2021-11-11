import { SugGetOptions, transformArguments as transformSugGetArguments } from './SUGGET';
import { SuggestionWithPayload } from './SUGGET_WITHPAYLOADS';
import { SuggestionWithScores } from './SUGGET_WITHSCORES';

export { IS_READ_ONLY } from './SUGGET';

export function transformArguments(key: string, prefix: string, options?: SugGetOptions): Array<string> {
    return [
        ...transformSugGetArguments(key, prefix, options),
        'WITHSCORES',
        'WITHPAYLOADS'
    ];
}

type SuggestionWithScoresAndPayloads = SuggestionWithScores & SuggestionWithPayload;

export function transformReply(rawReply: Array<string | null> | null): Array<SuggestionWithScoresAndPayloads> | null {
    if (rawReply === null) return null;

    const transformedReply = [];
    for (let i = 0; i < rawReply.length; i += 3) {
        transformedReply.push({
            suggestion: rawReply[i]!,
            score: Number(rawReply[i + 1]!),
            payload: rawReply[i + 2]
        });
    }

    return transformedReply;
}
