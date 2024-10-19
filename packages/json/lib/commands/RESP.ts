import { CommandParser } from "@redis/client/lib/client/parser";
import { Command, RedisArgument } from "@redis/client/lib/RESP/types";

type RESPReply = Array<string | number | RESPReply>;

export default {
    IS_READ_ONLY: true,
    parseCommand(parser: CommandParser, key: RedisArgument, path?: string) {
      parser.push('JSON.RESP');
      parser.pushKey(key);
      if (path !== undefined) {
        parser.push(path);
      }
    },
    transformReply: undefined as unknown as () => RESPReply
  } as const satisfies Command;