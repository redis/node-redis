import { DoublyLinkedNode } from './linked-list';

// `setTimeout` fires at once for a longer delay. The timer handler arms again when it
// runs before the deadline, so a longer timeout still works.
const MAX_TIMER_DELAY = 2 ** 31 - 1;

// The largest timeout `AbortSignal.timeout` accepts, which the queue used before.
const MAX_TIMEOUT = 2 ** 32 - 1;

/**
 * One deadline. While it is in a list, its item's `timerEntry` points at it, so every entry
 * in a list is live.
 */
export interface DeadlineEntry<T> {
  item: T;
  /** The `performance.now()` value at which the item times out. */
  deadline: number;
  /** The item's node in the write queue. Read only while the item waits to be sent. */
  node: DoublyLinkedNode<T> | undefined;
  previous: DeadlineEntry<T> | undefined;
  next: DeadlineEntry<T> | undefined;
  /** The list that holds the entry; `undefined` while the item moves between queues. */
  list: DeadlineList<T> | undefined;
}

export interface HasDeadline<T> {
  timerEntry: DeadlineEntry<T> | undefined;
}

/** An item moved into a queue: its timeout and its node in the new write queue. */
export interface AdoptedItem<T> {
  item: T;
  ms: number;
  node: DoublyLinkedNode<T>;
}

/**
 * The deadlines of the items that share one timeout value, oldest first. Because the
 * timeout is the same, the order they are added is the order they expire, so only the
 * head can be the next to expire.
 */
class DeadlineList<T> {
  head: DeadlineEntry<T> | undefined = undefined;
  tail: DeadlineEntry<T> | undefined = undefined;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;
  /** The deadline the timer is armed for. */
  armedFor = Infinity;

  constructor(readonly timeout: number) {}

  push(entry: DeadlineEntry<T>) {
    entry.list = this;
    entry.previous = this.tail;
    if (this.tail === undefined) {
      this.head = entry;
    } else {
      this.tail.next = entry;
    }
    this.tail = entry;
  }

  remove(entry: DeadlineEntry<T>) {
    const { previous, next } = entry;
    if (previous === undefined) {
      this.head = next;
    } else {
      previous.next = next;
    }
    if (next === undefined) {
      this.tail = previous;
    } else {
      next.previous = previous;
    }
    entry.previous = entry.next = entry.list = undefined;
  }

  /**
   * Inserts an entry in deadline order. Only for an item moved from another queue. The walk
   * starts behind `after`, an entry of this list whose deadline is not later, if given.
   */
  insert(entry: DeadlineEntry<T>, after?: DeadlineEntry<T>) {
    let next = after === undefined ? this.head : after.next;
    while (next !== undefined && next.deadline <= entry.deadline) next = next.next;
    if (next === undefined) {
      this.push(entry);
      return;
    }
    entry.list = this;
    entry.next = next;
    entry.previous = next.previous;
    if (next.previous === undefined) {
      this.head = entry;
    } else {
      next.previous.next = entry;
    }
    next.previous = entry;
  }
}

/**
 * The command timeouts of one queue: one list per timeout value, with one timer per list.
 *
 * - Adding a deadline costs a push. A later deadline of the same list never needs an
 *   earlier timer, so commands that arrive fast cause no timer calls.
 * - Ending a timeout unlinks its entry from its list.
 * - The timer is never cleared when a timeout ends. When it fires, it takes the expired
 *   entries from the head and stops at the first one that has not expired, so it never
 *   walks the items that are still waiting. A timeout never fires early.
 */
export class CommandDeadlines<T extends HasDeadline<T>> {
  readonly #lists = new Map<number, DeadlineList<T>>();
  /** The list used last; nearly every command has the same timeout. */
  #lastList: DeadlineList<T> | undefined;
  readonly #onExpire: (item: T, node: DoublyLinkedNode<T> | undefined) => void;

  /**
   * @param onExpire Called for each item whose deadline passed, after its timeout ended.
   * `node` is the item's write-queue node, if it got one when its deadline was set.
   */
  constructor(onExpire: (item: T, node: DoublyLinkedNode<T> | undefined) => void) {
    this.#onExpire = onExpire;
  }

  /**
   * Starts a timeout of `ms` for `item`. Replaces the item's earlier timeout, if any.
   * Throws, and changes nothing, when `ms` is not an integer from 0 to 2^32 - 1: the same
   * error `AbortSignal.timeout(ms)` throws, which the queue used before.
   */
  add(item: T, ms: number, node: DoublyLinkedNode<T> | undefined) {
    if (typeof ms !== 'number' || !Number.isInteger(ms) || ms < 0 || ms > MAX_TIMEOUT) {
      AbortSignal.timeout(ms);
      throw new RangeError(`Invalid timeout: ${String(ms)}`);
    }

    CommandDeadlines.end(item);
    const list = this.#list(ms);
    const entry: DeadlineEntry<T> = {
      item,
      deadline: performance.now() + ms,
      node,
      previous: undefined,
      next: undefined,
      list: undefined
    };
    item.timerEntry = entry;
    list.push(entry);
    if (list.timer === undefined) this.#arm(list, entry.deadline);
  }

  /** Ends the item's timeout, if it has one. */
  static end<T extends HasDeadline<T>>(item: T) {
    const entry = item.timerEntry;
    if (entry === undefined) return;
    item.timerEntry = undefined;
    entry.list?.remove(entry);
  }

  /**
   * For an item that leaves its queue: takes its entry out of the queue's lists, so that
   * queue's timer no longer sees it. The queue it moves to calls `adoptAll`.
   */
  static detach<T extends HasDeadline<T>>(item: T) {
    const entry = item.timerEntry;
    if (entry === undefined) return;
    entry.list?.remove(entry);
    entry.node = undefined;
  }

  /**
   * Takes over the timeouts of items that `detach` moved out of another queue. Each item
   * keeps its deadline; items without a timeout are skipped. Returns the moves whose
   * deadline already passed, with their timeouts ended. Runs no callback.
   *
   * Pass the moves oldest deadline first: each list is then merged in one walk.
   */
  adoptAll<M extends AdoptedItem<T>>(moves: ReadonlyArray<M>): M[] {
    const now = performance.now();
    const expired: M[] = [];
    // The entry inserted last in each list. Nothing can unlink it during this call.
    const lastInserted = new Map<DeadlineList<T>, DeadlineEntry<T>>();
    for (const move of moves) {
      const entry = move.item.timerEntry;
      if (entry === undefined) continue;
      if (entry.deadline <= now) {
        move.item.timerEntry = undefined;
        expired.push(move);
        continue;
      }
      entry.node = move.node;
      const list = this.#list(move.ms);
      const previous = lastInserted.get(list);
      list.insert(entry, previous !== undefined && previous.deadline <= entry.deadline ? previous : undefined);
      lastInserted.set(list, entry);
    }
    for (const list of lastInserted.keys()) this.#arm(list, list.head!.deadline);
    return expired;
  }

  /** Stops every timer. For a queue whose items were all settled. */
  clear() {
    for (const list of this.#lists.values()) {
      if (list.timer !== undefined) clearTimeout(list.timer);
    }
    this.#lists.clear();
    this.#lastList = undefined;
  }

  #list(ms: number) {
    let list = this.#lastList;
    if (list === undefined || list.timeout !== ms) {
      list = this.#lists.get(ms);
      if (list === undefined) {
        list = new DeadlineList<T>(ms);
        this.#lists.set(ms, list);
      }
      this.#lastList = list;
    }
    return list;
  }

  /** Makes sure the list's timer fires no later than `deadline`. */
  #arm(list: DeadlineList<T>, deadline: number) {
    if (list.timer !== undefined) {
      if (list.armedFor <= deadline) return;
      clearTimeout(list.timer);
    }
    list.armedFor = deadline;
    list.timer = setTimeout(
      this.#onTimer,
      Math.min(MAX_TIMER_DELAY, Math.max(1, Math.ceil(deadline - performance.now()))),
      list
    );
    list.timer.unref();
  }

  #onTimer = (list: DeadlineList<T>) => {
    list.timer = undefined;
    const now = performance.now();
    let expired: DeadlineEntry<T>[] | undefined;
    let entry = list.head;
    while (entry !== undefined && entry.deadline <= now) {
      entry.item.timerEntry = undefined;
      entry.list = undefined;
      (expired ??= []).push(entry);
      entry = entry.next;
    }
    if (expired !== undefined) {
      // Cut the expired entries off at once; nothing unlinks them one by one.
      list.head = entry;
      if (entry === undefined) {
        list.tail = undefined;
      } else {
        entry.previous = undefined;
      }
    }
    if (entry !== undefined) {
      this.#arm(list, entry.deadline);
    } else {
      if (this.#lists.get(list.timeout) === list) this.#lists.delete(list.timeout);
      if (this.#lastList === list) this.#lastList = undefined;
    }

    // Call back after the list is updated: a callback can add items.
    if (expired) {
      for (const { item, node } of expired) this.#onExpire(item, node);
    }
  };
}
