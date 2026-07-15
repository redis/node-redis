import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export type ModuleListReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'ver'>, NumberReply],
]>>;

function moduleEntries(moduleReply: unknown): Array<[string, unknown]> {
  if (Array.isArray(moduleReply)) {
    const entries: Array<[string, unknown]> = [];
    for (let i = 0; i + 1 < moduleReply.length; i += 2) {
      const key = moduleReply[i];
      if (key === null || key === undefined) continue;
      entries.push([(key as { toString(): string }).toString(), moduleReply[i + 1]]);
    }
    return entries;
  }

  if (moduleReply instanceof Map) {
    return Array.from(moduleReply.entries(), ([key, value]) => {
      const k = key === null || key === undefined
        ? ''
        : (key as { toString(): string }).toString();
      return [k, value];
    });
  }

  if (moduleReply !== null && typeof moduleReply === 'object') {
    return Object.entries(moduleReply as Record<string, unknown>);
  }

  return [];
}

function transformModuleReply(moduleReply: unknown) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of moduleEntries(moduleReply)) {
    result[key] = value;
  }
  return result as { name: BlobStringReply; ver: NumberReply } & Record<string, unknown>;
}

function transformModuleListReply(reply: Array<unknown>) {
  return reply.map(moduleReply => transformModuleReply(moduleReply));
}

export default {
  parseCommand(parser: CommandParser) {
    parser.push('MODULE', 'LIST');
  },
  transformReply: {
    2: transformModuleListReply as unknown as (reply: UnwrapReply<Resp2Reply<ModuleListReply>>) => ModuleListReply,
    3: transformModuleListReply as unknown as () => ModuleListReply
  }
} as const satisfies Command;
