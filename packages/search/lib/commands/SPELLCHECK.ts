import { RedisArgument, CommandArguments, Command } from '@redis/client/dist/lib/RESP/types';

export interface Terms {
  mode: 'INCLUDE' | 'EXCLUDE';
  dictionary: RedisArgument;
}

export interface FtSpellCheckOptions {
  DISTANCE?: number;
  TERMS?: Terms | Array<Terms>;
  DIALECT?: number;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, query: RedisArgument, options?: FtSpellCheckOptions) {
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
  },
  // TODO
  // type SpellCheckRawReply = Array<[
  //   _: string,
  //   term: string,
  //   suggestions: Array<[score: string, suggestion: string]>
  // ]>;

  // type SpellCheckReply = Array<{
  //   term: string,
  //   suggestions: Array<{
  //     score: number,
  //     suggestion: string
  //   }>
  // }>;

  // export function transformReply(rawReply: SpellCheckRawReply): SpellCheckReply {
  //   return rawReply.map(([, term, suggestions]) => ({
  //     term,
  //     suggestions: suggestions.map(([score, suggestion]) => ({
  //       score: Number(score),
  //       suggestion
  //     }))
  //   }));
  // }
  transformReply: undefined as unknown as () => any
} as const satisfies Command;

function pushTerms(args: CommandArguments, { mode, dictionary }: Terms) {
  args.push('TERMS', mode, dictionary);
}
