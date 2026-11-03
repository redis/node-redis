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

/**
 * Connection-scoped Lua SHA cache. {@link clear} bumps {@link epoch} so in-flight
 * `_executeScript` / batch publishes that started before a flush cannot re-add SHAs
 * after the server cache was dropped (#2084).
 */
export class ScriptsInUseSet {
  readonly #shas = new Set<string>();
  #epoch = 0;

  get epoch() {
    return this.#epoch;
  }

  get size() {
    return this.#shas.size;
  }

  has(sha: string) {
    return this.#shas.has(sha);
  }

  add(sha: string) {
    this.#shas.add(sha);
  }

  /** Add only if no flush/invalidation happened since `epoch` was sampled. */
  addIfEpoch(sha: string, epoch: number) {
    if (epoch === this.#epoch) {
      this.#shas.add(sha);
    }
  }

  delete(sha: string) {
    this.#shas.delete(sha);
  }

  clear() {
    this.#shas.clear();
    this.#epoch++;
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.#shas.values();
  }
}

/** Plain `Set` in unit tests; {@link ScriptsInUseSet} on the live client. */
export type ScriptsInUse = Set<string> | ScriptsInUseSet;

function isScriptFlush(args: CommandArguments): boolean {
  return (
    args.length >= 2 &&
    String(args[0]).toUpperCase() === 'SCRIPT' &&
    String(args[1]).toUpperCase() === 'FLUSH'
  );
}

function addSha(scriptsInUse: ScriptsInUse, sha: string, epoch: number) {
  if (scriptsInUse instanceof ScriptsInUseSet) {
    scriptsInUse.addIfEpoch(sha, epoch);
  } else {
    scriptsInUse.add(sha);
  }
}

function sampleEpoch(scriptsInUse: ScriptsInUse): number {
  return scriptsInUse instanceof ScriptsInUseSet ? scriptsInUse.epoch : 0;
}

export default class RedisMultiCommand {
  private readonly typeMapping?: TypeMapping;

  constructor(typeMapping?: TypeMapping, scriptsInUse?: ScriptsInUse) {
    this.typeMapping = typeMapping;
    this.scriptsInUse = scriptsInUse ?? new Set();
  }

  readonly queue: Array<RedisMultiQueuedCommand> = [];

  /**
   * SHAs known to be loaded on this connection (often shared with the owning
   * client). Only mutated after a batch that actually ran — see
   * {@link publishScriptsInUse} (#2084).
   */
  readonly scriptsInUse: ScriptsInUse;

  /**
   * SHAs queued as EVAL/EVAL_RO in this builder only. Kept out of
   * {@link scriptsInUse} until the batch executes so an abandoned or
   * WatchError'd multi cannot poison later batches with EVALSHA.
   */
  readonly #pendingScripts = new Set<string>();

  /**
   * After a SCRIPT FLUSH is queued in this builder, inherited shared SHAs are
   * stale for later commands in the same batch (Redis will flush first).
   */
  #ignoreInheritedScripts = false;

  addCommand(args: CommandArguments, transformReply?: TransformReply) {
    // A flush in this batch drops anything we were about to load; later scripts
    // in the same builder must EVAL again (including ignoring shared SHAs).
    if (isScriptFlush(args)) {
      this.#pendingScripts.clear();
      this.#ignoreInheritedScripts = true;
    }

    this.queue.push({
      args,
      transformReply
    });
  }

  addScript(script: RedisScript, args: CommandArguments, transformReply?: TransformReply) {
    const redisArgs: CommandArguments = [];
    redisArgs.preserve = args.preserve;
    const knownOnConnection =
      !this.#ignoreInheritedScripts && this.scriptsInUse.has(script.SHA1);
    if (knownOnConnection || this.#pendingScripts.has(script.SHA1)) {
      redisArgs.push(script.IS_READ_ONLY ? 'EVALSHA_RO' : 'EVALSHA', script.SHA1);
    } else {
      this.#pendingScripts.add(script.SHA1);
      redisArgs.push(script.IS_READ_ONLY ? 'EVAL_RO' : 'EVAL', script.SCRIPT);
    }

    if (script.NUMBER_OF_KEYS !== undefined) {
      redisArgs.push(script.NUMBER_OF_KEYS.toString());
    }

    redisArgs.push(...args);

    this.addCommand(redisArgs, transformReply);
  }

  /**
   * After MULTI/PIPELINE successfully reaches Redis, merge this builder's
   * pending EVAL SHAs into the shared set — or clear it if the batch flushed.
   */
  publishScriptsInUse() {
    const epochBefore = sampleEpoch(this.scriptsInUse);

    if (this.queue.some(({ args }) => isScriptFlush(args))) {
      this.scriptsInUse.clear();
    }

    // After a flush clear, use the post-clear epoch so scripts queued after the
    // flush in this same batch are recorded; in-flight work holding epochBefore
    // will not re-add via addIfEpoch.
    const epochForPending = this.queue.some(({ args }) => isScriptFlush(args))
      ? sampleEpoch(this.scriptsInUse)
      : epochBefore;

    for (const sha of this.#pendingScripts) {
      addSha(this.scriptsInUse, sha, epochForPending);
    }
    this.#pendingScripts.clear();
  }

  /**
   * Pipeline batches may reject after Redis already ran SCRIPT FLUSH. Clear the
   * shared cache without publishing pending SHAs (their load state is unknown).
   */
  invalidateScriptsOnError() {
    if (this.queue.some(({ args }) => isScriptFlush(args))) {
      this.scriptsInUse.clear();
    }
    this.#pendingScripts.clear();
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
