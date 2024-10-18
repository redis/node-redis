import { RedisArgument, Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushOptionalVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RediSearchProperty, RediSearchLanguage } from './CREATE';

export type FtSearchParams = Record<string, RedisArgument | number>;

export function pushParamsArgument(args: Array<RedisArgument>, params?: FtSearchParams) {
  if (params) {
    const length = args.push('PARAMS', '');
    for (const key in params) {
      if (!Object.hasOwn(params, key)) continue;

      const value = params[key];
      args.push(
        key,
        typeof value === 'number' ? value.toString() : value
      );
    }

    args[length - 1] = (args.length - length).toString();
  }
}

export interface FtSearchOptions {
  VERBATIM?: boolean;
  NOSTOPWORDS?: boolean;
  INKEYS?: RedisVariadicArgument;
  INFIELDS?: RedisVariadicArgument;
  RETURN?: RedisVariadicArgument;
  SUMMARIZE?: boolean | {
    FIELDS?: RediSearchProperty | Array<RediSearchProperty>;
    FRAGS?: number;
    LEN?: number;
    SEPARATOR?: RedisArgument;
  };
  HIGHLIGHT?: boolean | {
    FIELDS?: RediSearchProperty | Array<RediSearchProperty>;
    TAGS?: {
      open: RedisArgument;
      close: RedisArgument;
    };
  };
  SLOP?: number;
  TIMEOUT?: number;
  INORDER?: boolean;
  LANGUAGE?: RediSearchLanguage;
  EXPANDER?: RedisArgument;
  SCORER?: RedisArgument;
  SORTBY?: RedisArgument | {
    BY: RediSearchProperty;
    DIRECTION?: 'ASC' | 'DESC';
  };
  LIMIT?: {
    from: number | RedisArgument;
    size: number | RedisArgument;
  };
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export function pushSearchOptions(args: Array<RedisArgument>, options?: FtSearchOptions) {
  if (options?.VERBATIM) {
    args.push('VERBATIM');
  }

  if (options?.NOSTOPWORDS) {
    args.push('NOSTOPWORDS');
  }

  pushOptionalVariadicArgument(args, 'INKEYS', options?.INKEYS);
  pushOptionalVariadicArgument(args, 'INFIELDS', options?.INFIELDS);
  pushOptionalVariadicArgument(args, 'RETURN', options?.RETURN);

  if (options?.SUMMARIZE) {
    args.push('SUMMARIZE');

    if (typeof options.SUMMARIZE === 'object') {
      pushOptionalVariadicArgument(args, 'FIELDS', options.SUMMARIZE.FIELDS);

      if (options.SUMMARIZE.FRAGS !== undefined) {
        args.push('FRAGS', options.SUMMARIZE.FRAGS.toString());
      }

      if (options.SUMMARIZE.LEN !== undefined) {
        args.push('LEN', options.SUMMARIZE.LEN.toString());
      }

      if (options.SUMMARIZE.SEPARATOR !== undefined) {
        args.push('SEPARATOR', options.SUMMARIZE.SEPARATOR);
      }
    }
  }

  if (options?.HIGHLIGHT) {
    args.push('HIGHLIGHT');

    if (typeof options.HIGHLIGHT === 'object') {
      pushOptionalVariadicArgument(args, 'FIELDS', options.HIGHLIGHT.FIELDS);

      if (options.HIGHLIGHT.TAGS) {
        args.push('TAGS', options.HIGHLIGHT.TAGS.open, options.HIGHLIGHT.TAGS.close);
      }
    }
  }

  if (options?.SLOP !== undefined) {
    args.push('SLOP', options.SLOP.toString());
  }

  if (options?.TIMEOUT !== undefined) {
    args.push('TIMEOUT', options.TIMEOUT.toString());
  }

  if (options?.INORDER) {
    args.push('INORDER');
  }

  if (options?.LANGUAGE) {
    args.push('LANGUAGE', options.LANGUAGE);
  }

  if (options?.EXPANDER) {
    args.push('EXPANDER', options.EXPANDER);
  }

  if (options?.SCORER) {
    args.push('SCORER', options.SCORER);
  }

  if (options?.SORTBY) {
    args.push('SORTBY');
    
    if (typeof options.SORTBY === 'string' || options.SORTBY instanceof Buffer) {
      args.push(options.SORTBY);
    } else {
      args.push(options.SORTBY.BY);

      if (options.SORTBY.DIRECTION) {
        args.push(options.SORTBY.DIRECTION);
      }
    }
  }

  if (options?.LIMIT) {
    args.push('LIMIT', options.LIMIT.from.toString(), options.LIMIT.size.toString());
  }

  pushParamsArgument(args, options?.PARAMS);

  if (options?.DIALECT !== undefined) {
    args.push('DIALECT', options.DIALECT.toString());
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, query: RedisArgument, options?: FtSearchOptions) {
    const args = ['FT.SEARCH', index, query];

    return pushSearchOptions(args, options);
  },
  transformReply: {
    2: (reply: SearchRawReply): SearchReply => {
      const withoutDocuments = (reply[0] + 1 == reply.length)

      const documents = [];
      let i = 1;
      while (i < reply.length) {
        documents.push({
          id: reply[i++],
          value: withoutDocuments ? Object.create(null) : documentValue(reply[i++])
        });
      }
  
      return {
        total: reply[0],
        documents
      };
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

export type SearchRawReply = Array<any>;

interface SearchDocumentValue {
  [key: string]: string | number | null | Array<SearchDocumentValue> | SearchDocumentValue;
}

export interface SearchReply {
  total: number;
  documents: Array<{
      id: string;
      value: SearchDocumentValue;
  }>;
}

function documentValue(tuples: any) {
  const message = Object.create(null);

  if (tuples == null) {
    return message;
  }

  let i = 0;
  while (i < tuples.length) {
      const key = tuples[i++],
          value = tuples[i++];
      if (key === '$') { // might be a JSON reply
          try {
              Object.assign(message, JSON.parse(value));
              continue;
          } catch {
              // set as a regular property if not a valid JSON
          }
      }

      message[key] = value;
  }

  return message;
}
