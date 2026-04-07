import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export type ModuleListReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'ver'>, NumberReply],
]>>;

function transformModuleReply(moduleReply: any) {
  if (Array.isArray(moduleReply)) {
    let name: BlobStringReply | undefined;
    let ver: NumberReply | undefined;

    for (let i = 0; i < moduleReply.length; i += 2) {
      const key = moduleReply[i]?.toString();
      if (key === 'name') {
        name = moduleReply[i + 1];
      } else if (key === 'ver') {
        ver = moduleReply[i + 1];
      }
    }

    return {
      name: name as BlobStringReply,
      ver: ver as NumberReply
    };
  }

  if (moduleReply instanceof Map) {
    let name: BlobStringReply | undefined;
    let ver: NumberReply | undefined;

    for (const [key, value] of moduleReply.entries()) {
      const normalizedKey = key?.toString();
      if (normalizedKey === 'name') {
        name = value;
      } else if (normalizedKey === 'ver') {
        ver = value;
      }
    }

    return {
      name: name as BlobStringReply,
      ver: ver as NumberReply
    };
  }

  return {
    name: moduleReply.name,
    ver: moduleReply.ver
  };
}

function transformModuleListReply(reply: Array<any>) {
  return reply.map(moduleReply => transformModuleReply(moduleReply));
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MODULE LIST command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/module-list/
   */
  parseCommand(parser: CommandParser) {
    parser.push('MODULE', 'LIST');
  },
  transformReply: {
    2: transformModuleListReply as unknown as (reply: UnwrapReply<Resp2Reply<ModuleListReply>>) => ModuleListReply,
    3: transformModuleListReply as unknown as () => ModuleListReply
  }
} as const satisfies Command;
