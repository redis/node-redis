import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command, MapReply, NumberReply, ReplyUnion, Resp2Reply, TuplesReply, UnwrapReply } from '../RESP/types';
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
  arguments?: ArrayReply<ReplyUnion>;
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
  arguments?: ArrayReply<ReplyUnion>;
  subcommands?: CommandDocsReply;
  reply_schema?: ReplyUnion;
}

export type CommandDocsReply = MapReply<BlobStringReply, CommandDoc>;

function transformArgument(reply: unknown): CommandDocsArgument {
  if (!Array.isArray(reply)) {
    return reply as CommandDocsArgument;
  }

  const argument: Record<string, unknown> = {};
  for (let i = 0; i < reply.length; i += 2) {
    const key = (reply[i] as { toString(): string }).toString();
    const value = reply[i + 1];

    if (key === 'arguments' && Array.isArray(value)) {
      argument.arguments = value.map(transformArgument);
    } else {
      argument[key] = value;
    }
  }

  return argument as CommandDocsArgument;
}

function transformDoc(reply: unknown): CommandDoc {
  if (!Array.isArray(reply)) {
    return reply as CommandDoc;
  }

  const doc: Record<string, unknown> = {};
  for (let i = 0; i < reply.length; i += 2) {
    const key = (reply[i] as { toString(): string }).toString();
    const value = reply[i + 1];

    switch (key) {
      case 'arguments':
        doc.arguments = Array.isArray(value) ? value.map(transformArgument) : value;
        break;
      case 'subcommands':
        doc.subcommands = transformDocsMap(value);
        break;
      case 'reply_schema':
        doc.reply_schema = Array.isArray(value) ? transformDoc(value) : value;
        break;
      default:
        doc[key] = value;
    }
  }

  return doc as CommandDoc;
}

function transformDocsMap(reply: unknown): CommandDocsReply {
  if (!Array.isArray(reply)) {
    return reply as CommandDocsReply;
  }

  const docs: Record<string, CommandDoc> = {};
  for (let i = 0; i < reply.length; i += 2) {
    const name = (reply[i] as { toString(): string }).toString();
    docs[name] = transformDoc(reply[i + 1]);
  }

  return docs as unknown as CommandDocsReply;
}

export default {
  NOT_KEYED_COMMAND: true,
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
    2: (reply: UnwrapReply<Resp2Reply<CommandDocsReply>>) => transformDocsMap(reply),
    3: undefined as unknown as () => CommandDocsReply
  }
} as const satisfies Command;
