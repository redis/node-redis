interface SpellCheckTerms {
    mode: 'INCLUDE' | 'EXCLUDE';
    dictionary: string;
}

interface SpellCheckOptions {
    DISTANCE?: number;
    TERMS?: SpellCheckTerms | Array<SpellCheckTerms>;
    DIALECT?: number;
}

export function transformArguments(index: string, query: string, options?: SpellCheckOptions): Array<string> {
    const args = ['FT.SPELLCHECK', index, query];

    if (options?.DISTANCE) {
        args.push('DISTANCE', options.DISTANCE.toString());
    }

    if (options?.TERMS) {
        if (Array.isArray(options.TERMS)) {
            for (const term of options.TERMS) {
                pushTerms(args, term);
            }
        } else {
            pushTerms(args, options.TERMS);
        }
    }

    if (options?.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }

    return args;
}

function pushTerms(args: Array<string>, { mode, dictionary }: SpellCheckTerms): void {
    args.push('TERMS', mode, dictionary);
}

type SpellCheckRawReply = Array<[
    _: string,
    term: string,
    suggestions: Array<[score: string, suggestion: string]>
]>;

type SpellCheckReply = Array<{
    term: string,
    suggestions: Array<{
        score: number,
        suggestion: string
    }>
}>;

export function transformReply(rawReply: SpellCheckRawReply): SpellCheckReply {
    return rawReply.map(([, term, suggestions]) => ({
        term,
        suggestions: suggestions.map(([score, suggestion]) => ({
            score: Number(score),
            suggestion
        }))
    }));
}
