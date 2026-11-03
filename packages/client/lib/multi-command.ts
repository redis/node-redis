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

function isScriptFlush(args: CommandArguments): boolean {
  return (
    args.length >= 2 &&
    String(args[0]).toUpperCase() === 'SCRIPT' &&
    String(args[1]).toUpperCase() === 'FLUSH'
  );
}

export default class RedisMultiCommand {
  private readonly typeMapping?: TypeMapping;

  constructor(typeMapping?: TypeMapping, scriptsInUse?: Set<string>) {
    this.typeMapping = typeMapping;
    this.scriptsInUse = scriptsInUse ?? new Set();
  }

  readonly queue: Array<RedisMultiQueuedCommand> = [];

  /**
   * SHAs known to be loaded on this connection (often shared with the owning
   * client). Only mutated after a batch that actually ran — see
   * {@link publishScriptsInUse} (#2084).
   */
  readonly scriptsInUse: Set<string>;

  /**
   * SHAs queued as EVAL/EVAL_RO in this builder only. Kept out of
   * {@link scriptsInUse} until the batch executes so an abandoned or
   * WatchError'd multi cannot poison later batches with EVALSHA.
   */
  readonly #pendingScripts = new Set<string>();

  addCommand(args: CommandArguments, transformReply?: TransformReply) {
    // A flush in this batch drops anything we were about to load; later scripts
    // in the same builder must EVAL again.
    if (isScriptFlush(args)) {
      this.#pendingScripts.clear();
    }

    this.queue.push({
      args,
      transformReply
    });
  }

  addScript(script: RedisScript, args: CommandArguments, transformReply?: TransformReply) {
    const redisArgs: CommandArguments = [];
    redisArgs.preserve = args.preserve;
    if (
      this.scriptsInUse.has(script.SHA1) ||
      this.#pendingScripts.has(script.SHA1)
    ) {
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
    if (this.queue.some(({ args }) => isScriptFlush(args))) {
      this.scriptsInUse.clear();
    }

    for (const sha of this.#pendingScripts) {
      this.scriptsInUse.add(sha);
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
