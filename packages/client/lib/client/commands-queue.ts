import { DoublyLinkedNode, DoublyLinkedList, EmptyAwareSinglyLinkedList } from './linked-list';
import encodeCommand from '../RESP/encoder';
import { Decoder, PUSH_TYPE_MAPPING, RESP_TYPES } from '../RESP/decoder';
import { TypeMapping, ReplyUnion, RespVersions, RedisArgument } from '../RESP/types';
import { ChannelListeners, PubSub, PubSubCommand, PubSubListener, PubSubType, PubSubTypeListeners } from './pub-sub';
import {
  AbortError,
  AbortReadError,
  ErrorReply,
  CommandTimeoutDuringMaintenanceError,
  CommandTimeoutReadDuringMaintenanceError,
  TimeoutError,
  TimeoutReadError
} from '../errors';
import { MonitorCallback } from '.';
import { dbgMaintenance } from './enterprise-maintenance-manager';
import { AdoptedItem, CommandDeadlines, DeadlineEntry } from './command-deadlines';
import { defaultCommandMetadata, isBlocking } from '../command-metadata';

/**
 * @internal
 * A command written immediately in front of another as one unit: admitted, cancelled,
 * encoded, and written together, so nothing can land between the two on the wire.
 */
export interface CommandPrelude {
  args: ReadonlyArray<RedisArgument>;
  /**
   * Receives the prelude's outcome (`err` is set on an error reply or a failure before
   * the reply). The prelude never rejects the main command's promise by itself.
   */
  onReply(err?: unknown): void;
}

export interface CommandOptions<T = TypeMapping> {
  chainId?: symbol;
  asap?: boolean;
  /**
   * Rejects the command when the signal aborts. Without `rejectInFlight`, only a command
   * that was not sent yet is rejected (`AbortError`). With `rejectInFlight`, see
   * `rejectInFlight`.
   */
  abortSignal?: AbortSignal;
  /**
   * Maps between RESP and JavaScript types
   */
  typeMapping?: T;
  /**
   * Time in milliseconds after which the command is rejected. Without `rejectInFlight`, it
   * applies only while the command waits to be sent: it then rejects with `TimeoutError`
   * and the command is never sent. With `rejectInFlight`, it also applies after the
   * command was sent; see `rejectInFlight`.
   */
  timeout?: number;
  /**
   * When `true`, `timeout` and `abortSignal` also reject a command that was already sent
   * and is waiting for its reply. Such a command rejects with `TimeoutReadError` or
   * `AbortReadError`: the server may have executed it, so retry only if it is idempotent.
   * Its reply is discarded when it arrives; the connection stays open, and later commands
   * still wait behind it on the server.
   *
   * Commands that block on the server (`BLPOP`, `XREAD`, `WAIT`, ...) are not timed out
   * after they are sent; `abortSignal` still applies to them.
   *
   * For `multi().exec()` and `execAsPipeline()`, if `timeout` or `abortSignal` fires after
   * part of the batch was sent, every pending command of the batch rejects with the read
   * error, and the rest of the batch is still sent.
   *
   * After a read error, session state changed by the command (for example the database
   * selected by `SELECT`) is unknown.
   *
   * Default `false`.
   * @experimental
   */
  rejectInFlight?: boolean;
  /**
   * Client-side caching intent for this call: `true` caches the reply if the command is
   * eligible, `false` never caches it. Overrides the `cacheable` predicate and the tracking
   * mode default. Has no effect without `clientSideCache`.
   */
  cache?: boolean;
  /**
   * @internal
   * The slot the command is targeted to (if any)
   */
  slotNumber?: number;
  /**
   * @internal
   * Set by the cluster ASK-redirect handler. Signals the HIMPORT hook that this command rides
   * an ASK chain, so any keyless command it injects ahead of the main (key-bearing) command
   * would consume the one-shot ASKING flag — the hook re-issues ASKING right before the main.
   */
  askRedirect?: boolean;
  /**
   * @internal
   * A command to write in front of this one, as one unit (see `CommandPrelude`).
   */
  prelude?: CommandPrelude;
}

/**
 * The options a MULTI or pipeline takes from the pool, cluster or sentinel it was created
 * on. Only the keys that are set are passed to the node client, so an unset `timeout`
 * keeps the node client's own and `timeout: undefined` still opts out.
 */
export function pickBatchOptions(options: CommandOptions = {}) {
  const picked: Pick<CommandOptions, 'timeout' | 'abortSignal' | 'typeMapping' | 'rejectInFlight'> = {};
  if ('timeout' in options) picked.timeout = options.timeout;
  if ('abortSignal' in options) picked.abortSignal = options.abortSignal;
  if ('rejectInFlight' in options) picked.rejectInFlight = options.rejectInFlight;
  if ('typeMapping' in options) picked.typeMapping = options.typeMapping;
  return picked;
}

export interface CommandToWrite extends CommandWaitingForReply {
  args: ReadonlyArray<RedisArgument> | undefined;
  chainId: symbol | undefined;
  abort: {
    signal: AbortSignal;
    listener: () => unknown;
  } | undefined;
  /** The command's live deadline in the queue's `CommandDeadlines`, if it has a timeout. */
  timerEntry: DeadlineEntry<CommandToWrite> | undefined;
  /** The timeout of the command's deadline, in milliseconds. */
  effectiveTimeout?: number;
  /** The deadline was set while the maintenance timeout was in force. */
  wasInMaintenance?: boolean;
  slotNumber?: number;
  prelude?: CommandPrelude;
  /**
   * Set on the commands of a MULTI or pipeline queued with `addBatch`. Only the `head`
   * carries the batch's timeout and abort listeners.
   */
  batch?: 'head' | 'member';
  onCancel?: () => void;
  /** Keeps the timeout and abort listeners after the command is written. */
  rejectInFlight?: boolean;
  /** Set when the command moves to the read queue. */
  written?: boolean;
  /** On a batch head with `rejectInFlight`: every command of the batch, head included. */
  batchEntries?: CommandToWrite[];
  /** On the other commands of a batch with `rejectInFlight`: the batch head. */
  batchHead?: CommandToWrite;
  /** On a batch head with `rejectInFlight`: the batch is a pipeline, not a `MULTI`. */
  pipeline?: boolean;
}

export interface BatchCommand {
  args: ReadonlyArray<RedisArgument>;
  typeMapping?: TypeMapping;
}

export interface BatchOptions {
  chainId: symbol;
  slotNumber?: number;
  timeout?: number;
  abortSignal?: AbortSignal;
  rejectInFlight?: boolean;
  /**
   * The batch is a pipeline, not a `MULTI`, so its blocking commands block on the server.
   * With `rejectInFlight`, a pipeline that holds a blocking command stops its timeout
   * when its first command is written, like a single blocking command.
   */
  pipeline?: boolean;
  /**
   * Called when the timeout or abort signal removes the batch before any of it is written.
   */
  onCancel?: () => void;
}

interface CommandWaitingForReply {
  resolve(reply?: unknown): void;
  reject(err: unknown): void;
  /** Already rejected; a sent command keeps its read-queue place until its reply. */
  rejected?: boolean;
  channelsCounter: number | undefined;
  typeMapping: TypeMapping | undefined;
}

export type OnShardedChannelMoved = (channel: string, listeners: ChannelListeners) => void;

const PONG = Buffer.from('pong'),
  RESET = Buffer.from('RESET');

const RESP2_PUSH_TYPE_MAPPING = {
  ...PUSH_TYPE_MAPPING,
  [RESP_TYPES.SIMPLE_STRING]: Buffer
};

// Try to handle a push notification. Return whether you
// successfully consumed the notification or not. This is
// important in order for the queue to be able to pass the
// notification to another handler if the current one did not
// succeed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous push payload
type PushHandler = (pushItems: Array<any>) => boolean;

export default class RedisCommandsQueue {
  readonly #respVersion;
  readonly #maxLength;
  readonly #toWrite = new DoublyLinkedList<CommandToWrite>();
  readonly #waitingForReply =
    new EmptyAwareSinglyLinkedList<CommandWaitingForReply>();
  readonly #onShardedChannelMoved;
  #chainInExecution: symbol | undefined;
  readonly decoder;
  readonly #pubSub;
  readonly #clientId: string;

  #pushHandlers: PushHandler[] = [this.#onPush.bind(this)];

  #maintenanceCommandTimeout: number | undefined;

  setMaintenanceCommandTimeout(ms: number | undefined) {
    // Prevent possible api misuse
    if (this.#maintenanceCommandTimeout === ms) {
      dbgMaintenance(
        `Queue already set maintenanceCommandTimeout to ${ms}, skipping`,
      );
      return;
    }

    dbgMaintenance(`Setting maintenance command timeout to ${ms}`);
    this.#maintenanceCommandTimeout = ms;

    if (this.#maintenanceCommandTimeout === undefined) {
      dbgMaintenance(
        `Queue will keep maintenanceCommandTimeout for exisitng commands, just to be on the safe side. New commands will receive normal timeouts`,
      );
      return;
    }

    let counter = 0;
    const total = this.#toWrite.length + this.#waitingForReply.length;
    const relaxedInFlight = new Set<CommandToWrite>();

    // Overwrite timeouts of all eligible toWrite commands
    for (const node of this.#toWrite.nodes()) {
      const command = node.value;

      // A batch shares the timer of its first command, and a batch whose first
      // command or a command of its chain is already written is not cancelled
      // any more. With `rejectInFlight` that timer still runs, so relax it.
      if (command.batch === 'member' || this.#isBatchStarted(command)) {
        const head = command.batchHead ?? command;
        if (head.batchEntries && (head.written || this.#isBatchStarted(head))) {
          this.#relaxInFlight(head, this.#maintenanceCommandTimeout, relaxedInFlight);
        }
        continue;
      }

      counter++;
      // Overwrite the command's timeout
      this.#setDeadline(node, command, this.#maintenanceCommandTimeout, true);
    }

    // Only `rejectInFlight` commands keep a timer after they are written. A batch's timer
    // is on its head, which leaves the read queue at its own reply while the rest of the
    // batch still waits, so it is reached through any pending command of the batch.
    for (const entry of this.#waitingForReply) {
      const command = entry as CommandToWrite;
      this.#relaxInFlight(command.batchHead ?? command, this.#maintenanceCommandTimeout, relaxedInFlight);
    }
    counter += relaxedInFlight.size;
    dbgMaintenance(`Total of ${counter} of ${total} timeouts reset to ${ms}`);
  }

  /**
   * Replaces the live timer of a command that may be on the wire with the maintenance
   * timeout, once per `relaxed` set.
   */
  #relaxInFlight(command: CommandToWrite, ms: number, relaxed: Set<CommandToWrite>) {
    if (!command.timerEntry || command.rejected || relaxed.has(command)) return;
    relaxed.add(command);
    this.#setDeadline(undefined, command, ms, true);
  }

  get isPubSubActive() {
    return this.#pubSub.isActive;
  }

  /**
   * Returns the total number of pending commands (waiting to write + waiting for reply).
   */
  get pendingCount(): number {
    return this.#toWrite.length + this.#waitingForReply.length;
  }

  /**
   * Returns whether `size` more commands can be admitted without exceeding
   * `commandsQueueMaxLength`. When no max is configured, always true.
   */
  hasCapacity(size: number): boolean {
    if (!this.#maxLength) return true;
    return this.#toWrite.length + this.#waitingForReply.length + size <= this.#maxLength;
  }

  /**
   * The chainId of the most recently written command, if it belonged to a
   * MULTI/pipeline chain. While this is set, any command still in `#toWrite`
   * with a matching `chainId` is the tail of a chain that's already partially
   * sent to the server - the rest of that chain is in `#waitingForReply` and
   * out of view, so this tail must not be treated as a complete, relocatable
   * chain (see `flushWaitingForReply`, which rejects it instead of resending it).
   */
  get chainInExecution(): symbol | undefined {
    return this.#chainInExecution;
  }

  constructor(
    respVersion: RespVersions,
    maxLength: number | null | undefined,
    onShardedChannelMoved: OnShardedChannelMoved,
    clientId: string
  ) {
    this.#respVersion = respVersion;
    this.#maxLength = maxLength;
    this.#onShardedChannelMoved = onShardedChannelMoved;
    this.decoder = this.#initiateDecoder();
    this.#clientId = clientId;
    this.#pubSub = new PubSub(this.#clientId);
  }

  #onReply(reply: ReplyUnion) {
    this.#waitingForReply.shift()!.resolve(reply);
  }

  #onErrorReply(err: ErrorReply) {
    this.#waitingForReply.shift()!.reject(err);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous push payload
  #onPush(push: Array<any>) {
    // TODO: type
    if (this.#pubSub.handleMessageReply(push)) return true;

    const isShardedUnsubscribe = PubSub.isShardedUnsubscribe(push);
    if (isShardedUnsubscribe && !this.#waitingForReply.length) {
      const channel = push[1].toString();
      this.#onShardedChannelMoved(
        channel,
        this.#pubSub.removeShardedListeners(channel),
      );
      return true;
    } else if (isShardedUnsubscribe || PubSub.isStatusReply(push)) {
      const head = this.#waitingForReply.head!.value;
      if (
        (Number.isNaN(head.channelsCounter!) &&
          push[2] === this.#pubSub.residualAfterUnsubscribeAll(push)) ||
        --head.channelsCounter! === 0
      ) {
        this.#waitingForReply.shift()!.resolve();
      }
      return true;
    }
    return false;
  }

  #getTypeMapping() {
    const head = this.#waitingForReply.head;
    if (!head) return PUSH_TYPE_MAPPING;

    return head.value.typeMapping ?? {};
  }

  #initiateDecoder() {
    return new Decoder({
      onReply: (reply) => this.#onReply(reply),
      onErrorReply: (err) => this.#onErrorReply(err),
      //TODO: we can shave off a few cycles by not adding onPush handler at all if CSC is not used
      onPush: (push) => {
        for (const pushHandler of this.#pushHandlers) {
          if (pushHandler(push)) return;
        }
      },
      getTypeMapping: () => this.#getTypeMapping(),
    });
  }

  addPushHandler(handler: PushHandler): void {
    this.#pushHandlers.push(handler);
  }

  /**
   * Resolves `true` when the timeout fired and pending commands were flushed:
   * the server may still send their replies, so the socket's reply stream can
   * no longer be matched to the commands behind it and the caller must not
   * keep using the connection as is. Resolves `false` otherwise.
   */
  async waitForInflightCommandsToComplete(options?: {
    timeoutMs?: number;
    flushOnTimeout?: boolean;
  }): Promise<boolean> {
    // In-flight commands already completed
    if (this.#waitingForReply.length === 0) {
      return false;
    }
    // Otherwise wait for in-flight commands to fire `empty` event
    return new Promise((resolve) => {
      const onEmpty = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(false);
      };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutMs = options?.timeoutMs;
      if (timeoutMs !== undefined && timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          this.#waitingForReply.events.off("empty", onEmpty);
          const pendingCount = this.#waitingForReply.length;
          dbgMaintenance(
            `waitForInflightCommandsToComplete timed out after ${timeoutMs}ms with ${pendingCount} commands still waiting`,
          );
          if (options?.flushOnTimeout && pendingCount > 0) {
            dbgMaintenance(
              `Flushing ${pendingCount} commands that timed out waiting for reply`,
            );
            // These commands were written: the server may have executed them.
            this.#flushWaitingForReply(new TimeoutReadError(timeoutMs));
            // Resolve instead of reject - we don't want to fail the migration
            resolve(true);
            return;
          }
          resolve(false); // Resolve instead of reject - we don't want to fail the migration
        }, timeoutMs);
      }

      this.#waitingForReply.events.once("empty", onEmpty);
    });
  }

  /**
   * A batch whose chain is already partly written, e.g. an ASKING sent ahead of
   * its MULTI, must not be removed: the written command would then apply to the
   * next unrelated command.
   */
  #isBatchStarted(value: CommandToWrite) {
    return value.batch === 'head' &&
      value.chainId !== undefined &&
      value.chainId === this.#chainInExecution;
  }

  /**
   * Whether a fired listener must leave the command, or its batch, in place: it is
   * written, or it is a `rejectInFlight` batch whose chain is already partly written.
   */
  #isInFlight(value: CommandToWrite) {
    return value.written ||
      (value.batchEntries !== undefined && this.#isBatchStarted(value));
  }

  #createAbortListener(
    node: DoublyLinkedNode<CommandToWrite>,
    value: CommandToWrite,
  ) {
    return () => {
      if (this.#isInFlight(value)) {
        this.#rejectInFlight(value, new AbortReadError());
      } else if (!this.#isBatchStarted(value)) {
        this.#rejectCommand(node, value, new AbortError());
      }
    };
  }

  readonly #deadlines = new CommandDeadlines<CommandToWrite>(
    (value, node) => this.#onTimeout(node, value)
  );

  /** `node` may be omitted only for a command that `#isInFlight`. */
  #setDeadline(
    node: DoublyLinkedNode<CommandToWrite> | undefined,
    value: CommandToWrite,
    timeout: number,
    wasInMaintenance: boolean,
  ) {
    this.#deadlines.add(value, timeout, node);
    value.effectiveTimeout = timeout;
    value.wasInMaintenance = wasInMaintenance;
  }

  #onTimeout(node: DoublyLinkedNode<CommandToWrite> | undefined, value: CommandToWrite) {
    if (this.#isInFlight(value)) {
      this.#rejectInFlight(value, this.#timeoutReadError(value));
    } else if (!this.#isBatchStarted(value)) {
      this.#rejectCommand(node!, value, this.#timeoutError(value));
    }
  }

  #timeoutError(value: CommandToWrite) {
    return value.wasInMaintenance
      ? new CommandTimeoutDuringMaintenanceError(value.effectiveTimeout!)
      : new TimeoutError(`Command timed out after ${value.effectiveTimeout}ms waiting to be sent`);
  }

  #timeoutReadError(value: CommandToWrite) {
    return value.wasInMaintenance
      ? new CommandTimeoutReadDuringMaintenanceError(value.effectiveTimeout!)
      : new TimeoutReadError(value.effectiveTimeout!);
  }

  /**
   * Rejects a command that may be on the wire, or every pending command of its batch.
   * Never touches `#toWrite`.
   */
  #rejectInFlight(value: CommandToWrite, err: Error) {
    // A written command stays in the read queue, because replies are matched to commands
    // by position; its reply is discarded when it arrives. The unwritten tail of a batch,
    // `EXEC` included, stays queued and is still written, or the server would stay inside
    // `MULTI` (`client/index.ts:_executeMulti` relies on this).
    RedisCommandsQueue.#removeCommandListeners(value);
    for (const entry of value.batchEntries ?? [value]) {
      if (entry.rejected) continue;
      entry.rejected = true;
      entry.reject(err);
    }
  }

  #rejectCommand(
    node: DoublyLinkedNode<CommandToWrite>,
    value: CommandToWrite,
    err: Error,
  ) {
    if (value.rejected) return;

    value.rejected = true;
    RedisCommandsQueue.#removeCommandListeners(value);
    if (value.batch === 'head') {
      // The rest of the batch is queued right behind its first command.
      let member = node.next;
      while (member?.value.batch === 'member' && member.value.chainId === value.chainId) {
        const next = member.next;
        member.value.rejected = true;
        this.#toWrite.remove(member);
        member.value.reject(err);
        member = next;
      }
      value.onCancel?.();
    }
    this.#toWrite.remove(node);
    value.reject(err);
  }

  /**
   * Inserts at the front of `#toWrite`, but behind the unwritten tail of a chain
   * that is already partly on the wire, so that a MULTI is never split by a
   * command that is not part of it.
   */
  #insertAtFront(value: CommandToWrite) {
    const chainId = this.#chainInExecution;
    let tailOfChain = this.#toWrite.head;
    if (chainId === undefined || tailOfChain?.value.chainId !== chainId) {
      return this.#toWrite.unshift(value);
    }

    while (tailOfChain.next?.value.chainId === chainId) {
      tailOfChain = tailOfChain.next;
    }
    return this.#toWrite.insertAfter(tailOfChain, value);
  }

  #addToWrite(value: CommandToWrite, asap = false) {
    return asap ?
      this.#insertAtFront(value) :
      this.#toWrite.push(value);
  }

  addCommand<T>(
    args: ReadonlyArray<RedisArgument>,
    options?: CommandOptions,
  ): Promise<T> {
    // A prelude and its command are admitted together or not at all.
    const size = options?.prelude ? 2 : 1;
    if (
      this.#maxLength &&
      this.#toWrite.length + this.#waitingForReply.length + size > this.#maxLength
    ) {
      return Promise.reject(new Error("The queue is full"));
    } else if (options?.abortSignal?.aborted) {
      return Promise.reject(new AbortError());
    }

    return new Promise((resolve, reject) => {
      const value: CommandToWrite = {
        args,
        chainId: options?.chainId,
        abort: undefined,
        timerEntry: undefined,
        effectiveTimeout: undefined,
        wasInMaintenance: undefined,
        resolve,
        reject,
        channelsCounter: undefined,
        typeMapping: options?.typeMapping,
      };
      value.slotNumber = options?.slotNumber;
      value.prelude = options?.prelude;
      value.rejectInFlight = options?.rejectInFlight;

      const node = this.#addToWrite(value, options?.asap);

      try {
        this.#arm(node, value, options?.timeout, options?.abortSignal);
      } catch (err) {
        RedisCommandsQueue.#removeCommandListeners(value);
        this.#toWrite.remove(node);
        reject(err);
      }
    });
  }

  #arm(
    node: DoublyLinkedNode<CommandToWrite>,
    value: CommandToWrite,
    originalTimeout: number | undefined,
    abortSignal: AbortSignal | undefined
  ) {
    // If #maintenanceCommandTimeout was explicitly set, we should
    // use it instead of the timeout provided by the command
    const timeout = this.#maintenanceCommandTimeout ?? originalTimeout;
    const wasInMaintenance = this.#maintenanceCommandTimeout !== undefined;
    if (timeout) {
      this.#setDeadline(node, value, timeout, wasInMaintenance);
    }

    if (abortSignal) {
      if (abortSignal.aborted) throw new AbortError();
      value.abort = {
        signal: abortSignal,
        listener: this.#createAbortListener(node, value),
      };
      abortSignal.addEventListener("abort", value.abort.listener, { once: true });
    }
  }

  /**
   * Queues a MULTI or pipeline. Like a single command, the batch has one timeout and
   * one abort listener, which stop when its first command is written. If either fires
   * first, and no command of its chain is written yet, every command of the batch
   * is removed from the queue and rejected.
   *
   * With `rejectInFlight`, the listeners stop only when the last command of the batch
   * settles. If either fires after part of the chain is written, every pending command
   * rejects with the read error, and the rest of the batch is still written.
   */
  addBatch(
    commands: ReadonlyArray<BatchCommand>,
    options: BatchOptions
  ): Array<Promise<unknown>> {
    let head: DoublyLinkedNode<CommandToWrite> | undefined;
    const entries: CommandToWrite[] = [];
    const promises = commands.map(({ args, typeMapping }) => {
      if (!this.hasCapacity(1)) {
        return Promise.reject(new Error("The queue is full"));
      }

      return new Promise((resolve, reject) => {
        const node = this.#toWrite.push({
          args,
          chainId: options.chainId,
          abort: undefined,
          timerEntry: undefined,
          resolve,
          reject,
          channelsCounter: undefined,
          typeMapping,
          slotNumber: options.slotNumber,
          batch: head ? 'member' : 'head'
        });
        entries.push(node.value);
        head ??= node;
      });
    });

    if (head) {
      const headValue = head.value;
      headValue.onCancel = options.onCancel;
      if (options.rejectInFlight) {
        headValue.rejectInFlight = true;
        headValue.batchEntries = entries;
        headValue.pipeline = options.pipeline;
        for (let i = 1; i < entries.length; i++) entries[i].batchHead = headValue;
        RedisCommandsQueue.#beforeSettle(entries[entries.length - 1], () =>
          RedisCommandsQueue.#removeCommandListeners(headValue)
        );
      }
      try {
        this.#arm(head, head.value, options.timeout, options.abortSignal);
      } catch (err) {
        // Nothing is written synchronously, so the batch is still whole.
        this.#rejectCommand(head, head.value, err as Error);
      }
    }

    return promises;
  }

  #addPubSubCommand(command: PubSubCommand, asap = false, chainId?: symbol) {
    return new Promise<void>((resolve, reject) => {
      this.#addToWrite(
        {
          args: command.args,
          chainId,
          abort: undefined,
          timerEntry: undefined,
          resolve() {
            command.resolve();
            resolve();
          },
          reject: (err) => {
            command.reject?.(err);
            this.#restoreDecoderIfPubSubInactive();
            // a teardown that carried this command's intent to another
            // member (multi-db move) is a success for the caller — the
            // subscription change lives on, on the adopting member
            if (command.carried?.()) {
              resolve();
            } else {
              reject(err);
            }
          },
          channelsCounter: command.channelsCounter,
          typeMapping: PUSH_TYPE_MAPPING,
        },
        asap,
      );
    });
  }

  #setupPubSubHandler() {
    // RESP3 uses `onPush` to handle PubSub, so no need to modify `onReply`
    if (this.#respVersion !== 2) return;

    this.decoder.onReply = ((reply) => {
      if (Array.isArray(reply)) {
        if (this.#onPush(reply)) return;

        const firstElement =
          typeof reply[0] === "string" ? Buffer.from(reply[0]) : reply[0];
        if (PONG.equals(firstElement as Buffer)) {
          const { resolve, typeMapping } = this.#waitingForReply.shift()!,
            buffer = (
              (reply[1] as Buffer).length === 0 ? reply[0] : reply[1]
            ) as Buffer;
          resolve(
            typeMapping?.[RESP_TYPES.SIMPLE_STRING] === Buffer
              ? buffer
              : buffer.toString(),
          );
          return;
        }
      }

      return this.#onReply(reply);
    }) as Decoder["onReply"];
    this.decoder.getTypeMapping = () => RESP2_PUSH_TYPE_MAPPING;
  }

  subscribe<T extends boolean>(
    type: PubSubType,
    channels: string | Array<string>,
    listener: PubSubListener<T>,
    returnBuffers?: T,
  ) {
    const command = this.#pubSub.subscribe(
      type,
      channels,
      listener,
      returnBuffers,
    );
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  #resetDecoderCallbacks() {
    this.decoder.onReply = ((reply) =>
      this.#onReply(reply)) as Decoder["onReply"];
    this.decoder.getTypeMapping = () => this.#getTypeMapping();
  }

  #restoreDecoderIfPubSubInactive() {
    if (this.#respVersion !== 2 || this.#pubSub.isActive) return;

    // if `RESET` already overrides `onReply`, restore its fallback instead
    if (this.decoder.onReply === this.#resetOnReply) {
      this.#resetFallbackOnReply = ((reply) =>
        this.#onReply(reply)) as Decoder["onReply"];
      this.decoder.getTypeMapping = () => this.#getTypeMapping();
    } else {
      this.#resetDecoderCallbacks();
    }
  }

  unsubscribe<T extends boolean>(
    type: PubSubType,
    channels?: string | Array<string>,
    listener?: PubSubListener<T>,
    returnBuffers?: T,
  ) {
    const command = this.#pubSub.unsubscribe(
      type,
      channels,
      listener,
      returnBuffers,
    );
    if (!command) return;

    if (command && this.#respVersion === 2) {
      // RESP2 modifies `onReply` to handle PubSub (see #setupPubSubHandler)
      const { resolve } = command;
      // resolve first: it drops the listeners and recomputes `isActive`
      command.resolve = () => {
        resolve();
        this.#restoreDecoderIfPubSubInactive();
      };
    }

    return this.#addPubSubCommand(command);
  }

  removeAllPubSubListeners() {
    return this.#pubSub.removeAllListeners();
  }

  removeShardedPubSubListenersForSlots(slots: Set<number>) {
    return this.#pubSub.removeShardedPubSubListenersForSlots(slots);
  }

  resubscribe(chainId?: symbol) {
    const commands = this.#pubSub.resubscribe();
    if (!commands.length) return;

    this.#setupPubSubHandler();
    return Promise.all(
      commands.map((command) => this.#addPubSubCommand(command, true, chainId)),
    );
  }

  extendPubSubChannelListeners(
    type: PubSubType,
    channel: string,
    listeners: ChannelListeners,
  ) {
    const command = this.#pubSub.extendChannelListeners(
      type,
      channel,
      listeners,
    );
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  extendPubSubListeners(type: PubSubType, listeners: PubSubTypeListeners) {
    const command = this.#pubSub.extendTypeListeners(type, listeners);
    if (!command) return;

    this.#setupPubSubHandler();
    return this.#addPubSubCommand(command);
  }

  getPubSubListeners(type: PubSubType) {
    return this.#pubSub.listeners[type];
  }

  monitor(callback: MonitorCallback, options?: CommandOptions) {
    return new Promise<void>((resolve, reject) => {
      const typeMapping = options?.typeMapping ?? {};
      this.#addToWrite(
        {
          args: ["MONITOR"],
          chainId: options?.chainId,
          abort: undefined,
          timerEntry: undefined,
          // using `resolve` instead of using `.then`/`await` to make sure it'll be called before processing the next reply
          resolve: () => {
            // after running `MONITOR` only `MONITOR` and `RESET` replies are expected
            // any other command should cause an error

            // if `RESET` already overrides `onReply`, set monitor as it's fallback
            if (this.decoder.onReply === this.#resetOnReply) {
              this.#resetFallbackOnReply = callback;
            } else {
              this.decoder.onReply = callback;
            }

            this.decoder.getTypeMapping = () => typeMapping;
            resolve();
          },
          reject,
          channelsCounter: undefined,
          typeMapping,
        },
        options?.asap,
      );
    });
  }

  resetDecoder() {
    this.#resetDecoderCallbacks();
    this.decoder.reset();
  }

  #resetFallbackOnReply?: Decoder["onReply"];
  #resetOnReply?: Decoder["onReply"];

  async reset<T extends TypeMapping>(chainId: symbol, typeMapping?: T) {
    return new Promise((resolve, reject) => {
      // overriding onReply to handle `RESET` while in `MONITOR` or PubSub mode
      this.#resetFallbackOnReply = this.decoder.onReply;
      this.decoder.onReply = this.#resetOnReply = ((reply) => {
        if (
          (typeof reply === "string" && reply === "RESET") ||
          (reply instanceof Buffer && RESET.equals(reply))
        ) {
          this.#resetDecoderCallbacks();
          this.#resetFallbackOnReply = undefined;
          this.#pubSub.reset();

          this.#waitingForReply.shift()!.resolve(reply);
          return;
        }

        this.#resetFallbackOnReply!(reply);
      }) as Decoder["onReply"];

      this.#toWrite.push({
        args: ["RESET"],
        chainId,
        abort: undefined,
        timerEntry: undefined,
        resolve,
        reject,
        channelsCounter: undefined,
        typeMapping,
      });
    });
  }

  isWaitingToWrite() {
    return this.#toWrite.length > 0;
  }

  *commandsToWrite() {
    let toSend = this.#toWrite.shift();
    while (toSend) {
      let encoded: ReadonlyArray<RedisArgument>;
      try {
        encoded = encodeCommand(toSend.args!);
        // Encode the prelude with its command, so a failure writes neither.
        if (toSend.prelude) {
          encoded = [...encodeCommand(toSend.prelude.args), ...encoded];
        }
      } catch (err) {
        CommandDeadlines.end(toSend);
        toSend.reject(err);
        toSend = this.#toWrite.shift();
        continue;
      }

      if (toSend.rejectInFlight) {
        RedisCommandsQueue.#keepListenersPastWrite(toSend);
      } else {
        if (toSend.abort) {
          RedisCommandsQueue.#removeAbortListener(toSend);
          toSend.abort = undefined;
        }
        // The timeout covers only the wait to be sent.
        CommandDeadlines.end(toSend);
      }
      // TODO reuse `toSend` or create new object?
      toSend.args = undefined;
      toSend.written = true;
      toSend.onCancel = undefined;
      this.#chainInExecution = toSend.chainId;
      toSend.chainId = undefined;
      if (toSend.prelude) {
        // The prelude's reply arrives first; it is reported, never propagated.
        const { onReply } = toSend.prelude;
        toSend.prelude = undefined;
        this.#waitingForReply.push({
          resolve: () => onReply(),
          reject: (err) => onReply(err),
          channelsCounter: undefined,
          typeMapping: undefined,
        });
      }
      this.#waitingForReply.push(toSend);

      yield encoded;
      toSend = this.#toWrite.shift();
    }
  }

  #flushWaitingForReply(err: Error): void {
    for (const node of this.#waitingForReply) {
      // A `rejectInFlight` entry that already rejected stays only to keep reply order.
      if (node.rejected) continue;
      node.reject(err);
    }
    this.#waitingForReply.reset();
  }

  /**
   * Whether the server can block on the command, or on any command of the pipeline it
   * heads. Must run before the command is written: it reads `args`. The `blocking` flag
   * comes from `command-metadata/predicates.ts:isBlocking`.
   */
  static #blocksOnServer(command: CommandToWrite) {
    // Commands inside `MULTI` do not block on the server.
    if (command.batch === 'head' && !command.pipeline) return false;

    return (command.batchEntries ?? [command]).some(({ args }) =>
      isBlocking(defaultCommandMetadata.lookup({ command: String(args![0]), subcommand: undefined }))
    );
  }

  static #keepListenersPastWrite(command: CommandToWrite) {
    if (command.timerEntry && RedisCommandsQueue.#blocksOnServer(command)) {
      // The server keeps blocking after a client-side timeout, so a read timeout would
      // only fail the call, not free the connection. A pipeline has one timer, so one
      // blocking command stops it for the whole pipeline.
      CommandDeadlines.end(command);
    }

    // A batch head keeps its listeners until the last command of the batch settles (see
    // `addBatch`).
    if (command.batch === 'head') return;

    if (command.timerEntry || command.abort) {
      // Every path that settles a read-queue entry (replies, error replies, RESP2 `PONG`,
      // `RESET`, flushes) goes through `resolve` or `reject`.
      RedisCommandsQueue.#beforeSettle(command, () =>
        RedisCommandsQueue.#removeCommandListeners(command)
      );
    }
  }

  /**
   * Runs `fn` before the command's promise settles. `fn` must read the command's
   * listeners when it runs: the maintenance timeout replaces them.
   */
  static #beforeSettle(command: CommandWaitingForReply, fn: () => void) {
    const { resolve, reject } = command;
    command.resolve = reply => {
      fn();
      resolve(reply);
    };
    command.reject = err => {
      fn();
      reject(err);
    };
  }

  static #removeAbortListener(command: CommandToWrite) {
    command.abort!.signal.removeEventListener("abort", command.abort!.listener);
  }

  static #removeCommandListeners(command: CommandToWrite) {
    if (command.abort) {
      RedisCommandsQueue.#removeAbortListener(command);
      command.abort = undefined;
    }
    CommandDeadlines.end(command);
  }

  static #flushToWrite(toBeSent: CommandToWrite, err: Error) {
    if (toBeSent.abort) {
      RedisCommandsQueue.#removeAbortListener(toBeSent);
    }
    CommandDeadlines.end(toBeSent);

    toBeSent.reject(err);
  }

  flushWaitingForReply(err: Error): void {
    this.resetDecoder();
    // reset after the rejects: a rejected in-flight SUBSCRIBE decrements the
    // subscribe counter, which would otherwise drop below 0
    this.#flushWaitingForReply(err);
    this.#pubSub.reset();

    if (!this.#chainInExecution) return;

    while (this.#toWrite.head?.value.chainId === this.#chainInExecution) {
      RedisCommandsQueue.#flushToWrite(this.#toWrite.shift()!, err);
    }

    this.#chainInExecution = undefined;
  }

  flushAll(err: Error): void {
    this.resetDecoder();
    this.#flushWaitingForReply(err);
    for (const node of this.#toWrite) {
      RedisCommandsQueue.#flushToWrite(node, err);
    }
    this.#toWrite.reset();
    this.#pubSub.reset();
    // No command is left, so no deadline is either.
    this.#deadlines.clear();
  }

  isEmpty() {
    return this.#toWrite.length === 0 && this.#waitingForReply.length === 0;
  }

  /**
   * Stops the deadline timers when no command is left. For a socket that closed: an armed
   * timer would keep the queue, and the client that owns it, alive until it fires.
   */
  clearDeadlinesIfEmpty() {
    if (this.isEmpty()) this.#deadlines.clear();
  }

  /**
   *
   * Extracts commands for the given slots from the toWrite queue.
   * Some commands don't have "slotNumber", which means they are not designated to particular slot/node.
   * We ignore those.
   *
   * A command whose chainId matches `chainInExecution` is the queued tail of a
   * chain (MULTI/pipeline) whose head was already written to this socket - the
   * rest is in `#waitingForReply`, out of view. Relocating just the tail would
   * split the transaction across two connections, and this connection isn't
   * going away (unlike a full node loss), so extraction stops there entirely:
   * that command and everything still queued behind it stay on this
   * connection, preserving the order they were originally sent in, and get
   * sent here as originally queued. If a key has by then moved to another
   * node, that surfaces as a normal MOVED/ASK error through this method's
   * caller. Atomic MULTI execution retries through the cluster redirect loop;
   * non-atomic pipeline execution intentionally does not.
   */
  extractCommandsForSlots(slots: Set<number>): CommandToWrite[] {
    const result: CommandToWrite[] = [];
    let current = this.#toWrite.head;
    while (current !== undefined) {
      if (current.value.slotNumber === undefined || !slots.has(current.value.slotNumber)) {
        current = current.next;
        continue;
      }

      if (this.#chainInExecution !== undefined && current.value.chainId === this.#chainInExecution) {
        break;
      }

      const command = current.value;
      if (command.abort) {
        RedisCommandsQueue.#removeAbortListener(command);
      }
      CommandDeadlines.detach(command);
      result.push(command);
      const toRemove = current;
      current = current.next;
      this.#toWrite.remove(toRemove);
    }
    return result;
  }

  /**
   * Extracts all commands from the write queue.
   */
  extractAllCommands(): CommandToWrite[] {
    const result: CommandToWrite[] = [];
    let current = this.#toWrite.head;
    while (current) {
      const command = current.value;
      if (command.abort) {
        RedisCommandsQueue.#removeAbortListener(command);
      }
      CommandDeadlines.detach(command);
      result.push(command);
      const toRemove = current;
      current = current.next;
      this.#toWrite.remove(toRemove);
    }
    return result;
  }

  /**
   * Rejects commands that were extracted but could not be moved to another queue.
   */
  rejectCommands(commands: CommandToWrite[], err: Error) {
    for (const command of commands) {
      if (command.rejected) continue;

      command.rejected = true;
      RedisCommandsQueue.#removeCommandListeners(command);
      command.reject(err);
    }
  }

  /**
   * Prepends commands to the write queue in reverse.
   *
   * Commands arriving here (from `extractAllCommands`/`extractCommandsForSlots` on
   * another queue, e.g. during cluster slot migration) may still carry an abort listener
   * bound to the node and queue they were removed from. That listener would reject the
   * caller's promise without actually removing the command from this queue, so it's
   * rebound to the node created here. A timeout keeps its deadline and moves to this
   * queue's timer.
   */
  prependCommandsToWrite(commands: CommandToWrite[]) {
    if (!commands.length) {
      return;
    }

    // Newest first, so each command lands in front of the ones behind it.
    const moves: AdoptedItem<CommandToWrite>[] = [];
    for (let i = commands.length - 1; i >= 0; i--) {
      const value = commands[i];
      const node = this.#insertAtFront(value);

      if (value.rejected) {
        this.#toWrite.remove(node);
        continue;
      }

      moves.push({ item: value, ms: value.effectiveTimeout!, node });
    }

    // Oldest first, so each deadline list is merged in one walk. Rejecting a command
    // changes the lists, so nothing is rejected before the merge ends.
    moves.reverse();
    for (const { item, node } of this.#deadlines.adoptAll(moves)) {
      this.#rejectCommand(node, item, this.#timeoutError(item));
    }

    for (const { item: value, node } of moves) {
      if (value.rejected) continue;

      if (value.abort) {
        RedisCommandsQueue.#removeAbortListener(value);
        if (value.abort.signal.aborted) {
          this.#rejectCommand(node, value, new AbortError());
        } else {
          value.abort.listener = this.#createAbortListener(node, value);
          value.abort.signal.addEventListener("abort", value.abort.listener, {
            once: true,
          });
        }
      }
    }
  }
}
