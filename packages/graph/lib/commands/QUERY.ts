import { RedisArgument, ArrayReply, BlobStringReply, NumberReply, NullReply, TuplesReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

type Headers = ArrayReply<BlobStringReply>;

type Data = ArrayReply<BlobStringReply | NumberReply | NullReply | Data>;

type Metadata = ArrayReply<BlobStringReply>;

type QueryRawReply = TuplesReply<[
  headers: Headers,
  data: Data,
  metadata: Metadata
] | [
  metadata: Metadata
]>;

type QueryParam = null | string | number | boolean | QueryParams | Array<QueryParam>;

type QueryParams = {
  [key: string]: QueryParam;
};

export interface QueryOptions {
  params?: QueryParams;
  TIMEOUT?: number;
}

export function parseQueryArguments(
  command: RedisArgument,
  parser: CommandParser,
  graph: RedisArgument,
  query: RedisArgument,
  options?: QueryOptions,
  compact?: boolean
) {
  parser.push(command);
  parser.pushKey(graph);
  const param = options?.params ?
    `CYPHER ${queryParamsToString(options.params)} ${query}` :
    query;
  parser.push(param);

  if (options?.TIMEOUT !== undefined) {
    parser.push('TIMEOUT', options.TIMEOUT.toString());
  }

  if (compact) {
    parser.push('--compact');
  }
}

function queryParamsToString(params: QueryParams) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${queryParamToString(value)}`)
    .join(' ');
}

function queryParamToString(param: QueryParam): string {
  if (param === null) {
    return 'null';
  }

  switch (typeof param) {
    case 'string':
      return `"${param.replace(/["\\]/g, '\\$&')}"`;

    case 'number':
    case 'boolean':
      return param.toString();
  }

  if (Array.isArray(param)) {
    return `[${param.map(queryParamToString).join(',')}]`;
  } else if (typeof param === 'object') {
    const body = [];
    for (const [key, value] of Object.entries(param)) {
      body.push(`${key}:${queryParamToString(value)}`);
    }
    return `{${body.join(',')}}`;
  } else {
    throw new TypeError(`Unexpected param type ${typeof param} ${param}`)
  }
}

export default {
  IS_READ_ONLY: false,
  parseCommand: parseQueryArguments.bind(undefined, 'GRAPH.QUERY'),
  transformReply(reply: UnwrapReply<QueryRawReply>) {
    return reply.length === 1 ? {
      headers: undefined,
      data: undefined,
      metadata: reply[0]
    } : {
      headers: reply[0],
      data: reply[1],
      metadata: reply[2]
    };
  }
} as const satisfies Command;
