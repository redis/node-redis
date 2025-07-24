import { CommandParser } from "../client/parser";
import { RedisArgument, ArrayReply, Command } from "../RESP/types";
import { RedisVariadicArgument } from "./generic-transformers";

/** XACKDEL deletion policies */
export const XAckDelPolicy = {
  /** Preserve references (default) */
  KEEPREF: "KEEPREF",
  /** Delete all references */
  DELREF: "DELREF",
  /** Only acknowledged entries */
  ACKED: "ACKED",
} as const;

/** XACKDEL reply codes */
export const XACKDEL_REPLY_CODES = {
  /** ID not found */
  NOT_FOUND: -1,
  /** Entry acknowledged and deleted */
  ACKNOWLEDGED_AND_DELETED: 1,
  /** Entry acknowledged but dangling references remain */
  ACKNOWLEDGED_DANGLING_REFS: 2,
} as const;

/**
 * Acknowledges and deletes one or multiple messages for a stream consumer group
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XACKDEL command to acknowledge and delete one or multiple messages for a stream consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge and delete
   * @param policy - Policy to apply when deleting entries (optional, defaults to KEEPREF)
   * @returns Array of integers: -1 (not found), 1 (acknowledged and deleted), 2 (acknowledged with dangling refs)
   * @see https://redis.io/commands/xackdel/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisVariadicArgument,
    policy?: (typeof XAckDelPolicy)[keyof typeof XAckDelPolicy],
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
  transformReply: undefined as unknown as () => ArrayReply<
    (typeof XACKDEL_REPLY_CODES)[keyof typeof XACKDEL_REPLY_CODES]
  >,
} as const satisfies Command;
