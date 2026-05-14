import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command, MapReply, UnwrapReply } from '../RESP/types';

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

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, ...commands: Array<string>) {
    parser.push('COMMAND', 'DOCS');
    if (commands.length > 0) {
      parser.push(...commands);
    }
  },
  transformReply(reply: UnwrapReply<CommandDocsRawReply>): CommandDocsReply {
    const result: CommandDocsReply = {};
    
    for (let i = 0; i < reply.length; i += 2) {
      const name = reply[i] as string;
      const details = reply[i + 1] as MapReply<BlobStringReply, BlobStringReply>;
      
      if (details) {
        result[name] = {};
        for (let j = 0; j < details.length; j += 2) {
          const key = details[j] as string;
          const value = details[j + 1] as string;
          
          if (key === 'arguments') {
            // Parse arguments if needed
            result[name].arguments = JSON.parse(value);
          } else {
            (result[name] as Record<string, unknown>)[key] = value;
          }
        }
      }
    }
    
    return result;
  }
} as const satisfies Command;
