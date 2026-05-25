import { CommandParser } from "../client/parser";
import { RedisArgument, ArrayReply, Command } from "../RESP/types";
import {
  StreamDeletionReplyCode,
  StreamDeletionPolicy,
} from "./common-stream.types";
import { RedisVariadicArgument } from "./generic-transformers";

/**
 * Acknowledges and deletes one or multiple messages for a stream consumer group
 */
export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisVariadicArgument,
    policy?: StreamDeletionPolicy
  ) {
    parser.push("XACKDEL");
    parser.pushKey(key);
    parser.push(group);

    if (policy) {
      parser.push(policy);
    }

    parser.push("IDS");
    parser.pushVariadicWithLength(id);
  },
  transformReply:
    undefined as unknown as () => ArrayReply<StreamDeletionReplyCode>,
} as const satisfies Command;
