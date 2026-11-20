import { CommandArguments, RedisScript, ReplyUnion, TransformReply, TypeMapping } from './RESP/types';
import { ErrorReply, MultiErrorReply } from './errors';

export type MULTI_REPLY = {
  GENERIC: 'generic';
  TYPED: 'typed';
};

export type MULTI_MODE = {
  TYPED: 'typed';
  UNTYPED: 'untyped';
};

export type MultiMode = MULTI_MODE[keyof MULTI_MODE];

export type MultiReply = MULTI_REPLY[keyof MULTI_REPLY];

export type MultiReplyType<T extends MultiReply, REPLIES> = T extends MULTI_REPLY['TYPED'] ? REPLIES : Array<ReplyUnion>;

export interface RedisMultiQueuedCommand {
  args: CommandArguments;
  transformReply?: TransformReply;
}

export default class RedisMultiCommand {
  private readonly typeMapping?: TypeMapping;
  /**
   * SHA1s of scripts known to be cached on the server, shared across batches
   * by the owning client (#2084). A script in this set is sent as `EVALSHA`
   * right away instead of re-uploading its source with `EVAL` on the first
   * use of every batch. Updated from the replies in `updateKnownScripts`.
   */
  private readonly knownScripts?: Set<string>;

  constructor(typeMapping?: TypeMapping, knownScripts?: Set<string>) {
    this.typeMapping = typeMapping;
    this.knownScripts = knownScripts;
  }

  readonly queue: Array<RedisMultiQueuedCommand> = [];

  readonly scriptsInUse = new Set<string>();

  /** The queue positions of script commands and how each was sent; see `updateKnownScripts`. */
  private readonly scriptCommands: Array<{ index: number; sha: string; viaSha: boolean }> = [];

  addCommand(args: CommandArguments, transformReply?: TransformReply) {
    this.queue.push({
      args,
      transformReply
    });
  }

  addScript(script: RedisScript, args: CommandArguments, transformReply?: TransformReply) {
    const redisArgs: CommandArguments = [];
    redisArgs.preserve = args.preserve;
    // `scriptsInUse` orders within the batch: an `EVAL` earlier in the same
    // batch is guaranteed to run first on the connection, so later uses can
    // ride its cache entry even before the batch settles.
    const viaSha = this.scriptsInUse.has(script.SHA1) || this.knownScripts?.has(script.SHA1) === true;
    this.scriptCommands.push({ index: this.queue.length, sha: script.SHA1, viaSha });
    if (viaSha) {
      redisArgs.push(script.IS_READ_ONLY ? 'EVALSHA_RO' : 'EVALSHA', script.SHA1);
    } else {
      this.scriptsInUse.add(script.SHA1);
      redisArgs.push(script.IS_READ_ONLY ? 'EVAL_RO' : 'EVAL', script.SCRIPT);
    }

    if (script.NUMBER_OF_KEYS !== undefined) {
      redisArgs.push(script.NUMBER_OF_KEYS.toString());
    }

    redisArgs.push(...args);

    this.addCommand(redisArgs, transformReply);
  }
  
  /**
   * Updates the shared known-scripts set from the batch's raw replies: a
   * script uploaded with `EVAL` that did not fail is now cached on the
   * server, and an `EVALSHA` answered with `NOSCRIPT` (the server lost its
   * cache, e.g. `SCRIPT FLUSH`) is forgotten so the next batch re-uploads.
   */
  updateKnownScripts(rawReplies: Array<unknown>): void {
    const knownScripts = this.knownScripts;
    if (!knownScripts) return;

    for (const { index, sha, viaSha } of this.scriptCommands) {
      // A script appended while an execution was already pending has no reply
      // in this result set - it was never sent, so it must not be recorded
      if (index >= rawReplies.length) continue;
      const reply = rawReplies[index];
      if (viaSha) {
        if (reply instanceof ErrorReply && reply.message.startsWith('NOSCRIPT')) {
          knownScripts.delete(sha);
        }
      } else if (!(reply instanceof ErrorReply)) {
        knownScripts.add(sha);
      }
    }
  }

  /**
   * Called when executing the batch threw instead of returning replies — a
   * pipeline rejects on the first error reply, so `updateKnownScripts` never
   * sees the array. A `NOSCRIPT` means the server lost a script this batch
   * sent as `EVALSHA`: forget every SHA the batch relied on, so the next
   * batch re-uploads. Over-forgetting is harmless (one extra `EVAL`).
   */
  handleExecError(err: unknown): void {
    const knownScripts = this.knownScripts;
    if (!knownScripts) return;
    if (!(err instanceof ErrorReply && err.message.startsWith('NOSCRIPT'))) return;

    for (const { sha, viaSha } of this.scriptCommands) {
      if (viaSha) knownScripts.delete(sha);
    }
  }

  transformReplies(rawReplies: Array<unknown>): Array<unknown> {
    const errorIndexes: Array<number> = [],
      replies = rawReplies.map((reply, i) => {
        if (reply instanceof ErrorReply) {
          errorIndexes.push(i);
          return reply;
        }

        const { transformReply, args } = this.queue[i];
        return transformReply ? transformReply(reply, args.preserve, this.typeMapping) : reply;
      });

    if (errorIndexes.length) throw new MultiErrorReply(replies, errorIndexes);
    return replies;
  }
}
