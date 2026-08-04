import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command, MapReply, NumberReply, ReplyUnion, Resp2Reply, TuplesReply, TypeMapping, UnwrapReply } from '../RESP/types';
import { RESP_TYPES } from '../RESP/decoder';
import { RedisVariadicArgument } from './generic-transformers';

export interface CommandDocsArgument {
  name?: BlobStringReply;
  type?: BlobStringReply;
  display_text?: BlobStringReply;
  key_spec_index?: NumberReply;
  token?: BlobStringReply;
  summary?: BlobStringReply;
  since?: BlobStringReply;
  deprecated_since?: BlobStringReply;
  flags?: ArrayReply<BlobStringReply>;
  arguments?: ArrayReply<CommandDocsArgument>;
}

export interface CommandDoc {
  summary?: BlobStringReply;
  since?: BlobStringReply;
  group?: BlobStringReply;
  complexity?: BlobStringReply;
  module?: BlobStringReply;
  doc_flags?: ArrayReply<BlobStringReply>;
  deprecated_since?: BlobStringReply;
  replaced_by?: BlobStringReply;
  history?: ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]>>;
  arguments?: ArrayReply<CommandDocsArgument>;
  subcommands?: CommandDocsReply;
  reply_schema?: ReplyUnion;
}

export type CommandDocsReply = MapReply<BlobStringReply, CommandDoc>;

function transformMap(
  reply: unknown,
  typeMapping: TypeMapping | undefined,
  transformValue: (key: string, value: unknown) => unknown
): unknown {
  if (!Array.isArray(reply)) {
    return reply;
  }

  const entries: Array<[string, unknown]> = [];
  for (let i = 0; i < reply.length; i += 2) {
    const key = (reply[i] as { toString(): string }).toString();
    entries.push([key, transformValue(key, reply[i + 1])]);
  }

  switch (typeMapping?.[RESP_TYPES.MAP]) {
    case Array:
      return entries.flat();
    case Map:
      return new Map(entries);
    default: {
      const object: Record<string, unknown> = {};
      for (const [key, value] of entries) {
        object[key] = value;
      }
      return object;
    }
  }
}

function transformArgument(reply: unknown, typeMapping?: TypeMapping): CommandDocsArgument {
  return transformMap(reply, typeMapping, (key, value) => {
    if (key === 'arguments' && Array.isArray(value)) {
      return value.map(argument => transformArgument(argument, typeMapping));
    }
    return value;
  }) as CommandDocsArgument;
}

function transformDoc(reply: unknown, typeMapping?: TypeMapping): CommandDoc {
  return transformMap(reply, typeMapping, (key, value) => {
    switch (key) {
      case 'arguments':
        return Array.isArray(value)
          ? value.map(argument => transformArgument(argument, typeMapping))
          : value;
      case 'subcommands':
        return transformDocsMap(value, typeMapping);
      case 'reply_schema':
        return value;
      default:
        return value;
    }
  }) as CommandDoc;
}

function transformDocsMap(reply: unknown, typeMapping?: TypeMapping): CommandDocsReply {
  return transformMap(
    reply,
    typeMapping,
    (_key, value) => transformDoc(value, typeMapping)
  ) as CommandDocsReply;
}

export default {
  IS_READ_ONLY: true,
  /**
   * @see https://redis.io/commands/command-docs/
   */
  parseCommand(parser: CommandParser, commands?: RedisVariadicArgument) {
    parser.push('COMMAND', 'DOCS');
    if (commands !== undefined) {
      parser.pushVariadic(commands);
    }
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<CommandDocsReply>>, _preserve?: unknown, typeMapping?: TypeMapping) =>
      transformDocsMap(reply, typeMapping),
    3: undefined as unknown as () => CommandDocsReply
  }
} as const satisfies Command;
