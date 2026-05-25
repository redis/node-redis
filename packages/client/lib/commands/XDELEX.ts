import { CommandParser } from "../client/parser";
import { RedisArgument, ArrayReply, Command } from "../RESP/types";
import {
  StreamDeletionPolicy,
  StreamDeletionReplyCode,
} from "./common-stream.types";
import { RedisVariadicArgument } from "./generic-transformers";

/**
 * Deletes one or multiple entries from the stream
 */
export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    id: RedisVariadicArgument,
    policy?: StreamDeletionPolicy
  ) {
    parser.push("XDELEX");
    parser.pushKey(key);

    if (policy) {
      parser.push(policy);
    }

    parser.push("IDS");
    parser.pushVariadicWithLength(id);
  },
  transformReply:
    undefined as unknown as () => ArrayReply<StreamDeletionReplyCode>,
} as const satisfies Command;
