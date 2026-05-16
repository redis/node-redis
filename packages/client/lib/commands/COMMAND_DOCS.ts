import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command, MapReply, Resp2Reply, UnwrapReply } from '../RESP/types';

type CommandDocsRawReply = ArrayReply<BlobStringReply | MapReply<BlobStringReply, BlobStringReply>>;

export type CommandDocsReply = Record<string, {
  summary?: string;
  since?: string;
  group?: string;
  complexity?: string;
  arguments?: Array<{
    name: string;
    type: string;
    optional?: boolean;
    multiple?: boolean;
  }>;
}>;

interface CommandDocsArgument {
  name: string;
  type: string;
  optional?: boolean;
  multiple?: boolean;
}

function transformArguments(args: unknown[]): CommandDocsArgument[] {
  if (!Array.isArray(args)) return [];
  
  return args.map((arg: unknown) => {
    if (!Array.isArray(arg)) return { name: '', type: '' };
    
    const result: Record<string, unknown> = {};
    const arr = arg as unknown[];
    
    for (let i = 0; i < arr.length; i += 2) {
      const key = arr[i] as string;
      const value = arr[i + 1];
      
      switch (key) {
        case 'name':
        case 'type':
          result[key] = value as string;
          break;
        case 'optional':
          result[key] = true;
          break;
        case 'multiple':
          result[key] = true;
          break;
        case 'flags':
          if (Array.isArray(value)) {
            if ((value as string[]).includes('optional')) result.optional = true;
            if ((value as string[]).includes('multiple')) result.multiple = true;
          }
          break;
      }
    }
    
    return result as unknown as CommandDocsArgument;
  });
}

function transformResp2Entry(details: unknown[]): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  
  for (let j = 0; j < details.length; j += 2) {
    const key = details[j] as string;
    const value = details[j + 1];
    
    if (key === 'arguments') {
      entry.arguments = transformArguments(value as unknown[]);
    } else {
      entry[key] = value;
    }
  }
  
  return entry;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, ...commands: Array<string>) {
    parser.push('COMMAND', 'DOCS');
    if (commands.length > 0) {
      parser.push(...commands);
    }
  },
  transformReply: {
    2(reply: UnwrapReply<Resp2Reply<CommandDocsRawReply>>): CommandDocsReply {
      const result: CommandDocsReply = {};
      const arr = reply as unknown[];
      
      for (let i = 0; i < arr.length; i += 2) {
        const name = arr[i] as string;
        const details = arr[i + 1] as unknown[];
        
        if (Array.isArray(details)) {
          result[name] = transformResp2Entry(details) as CommandDocsReply[string];
        }
      }
      
      return result;
    },
    3: undefined as unknown as () => CommandDocsReply
  }
} as const satisfies Command;
