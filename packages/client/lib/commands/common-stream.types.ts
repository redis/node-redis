/** Common stream deletion policies
 *
 *  Added in Redis 8.2
 */
export const STREAM_DELETION_POLICY = {
  /** Preserve references (default) */
  KEEPREF: "KEEPREF",
  /** Delete all references */
  DELREF: "DELREF",
  /** Only acknowledged entries */
  ACKED: "ACKED",
} as const;

export type StreamDeletionPolicy =
  (typeof STREAM_DELETION_POLICY)[keyof typeof STREAM_DELETION_POLICY];

/** Common reply codes for stream deletion operations */
export const STREAM_DELETION_REPLY_CODES = {
  /** ID not found */
  NOT_FOUND: -1,
  /** Entry deleted */
  DELETED: 1,
  /** Dangling references */
  DANGLING_REFS: 2,
} as const;

export type StreamDeletionReplyCode =
  (typeof STREAM_DELETION_REPLY_CODES)[keyof typeof STREAM_DELETION_REPLY_CODES];
