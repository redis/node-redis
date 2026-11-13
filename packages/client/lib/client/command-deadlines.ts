import { DoublyLinkedNode } from './linked-list';

// `setTimeout` fires at once for a longer delay. The timer handler arms again when it
// runs before the deadline, so a longer timeout still works.
const MAX_TIMER_DELAY = 2 ** 31 - 1;

// The largest timeout `AbortSignal.timeout` accepted, which the queue used before.
const MAX_TIMEOUT = 2 ** 32 - 1;

/**
 * One deadline. It is live while its item's `timerEntry` points at it, so ending a timeout
 * or giving the item a new deadline never has to find the old entry.
 */
export interface DeadlineEntry<T> {
  item: T;
  /** The `performance.now()` value at which the item times out. */
  deadline: number;
  /** The item's node in the write queue. Read only while the item waits to be sent. */
  node: DoublyLinkedNode<T> | undefined;
  next: DeadlineEntry<T> | undefined;
  /** The list that holds the entry; `undefined` while the item moves between queues. */
  list: ListEnds<T> | undefined;
}

export interface HasDeadline<T> {
  timerEntry: DeadlineEntry<T> | undefined;
}

/** The part of a `DeadlineList` that `CommandDeadlines.end` changes. */
interface ListEnds<T> {
  head: DeadlineEntry<T> | undefined;
  tail: DeadlineEntry<T> | undefined;
}

/**
 * The deadlines of the items that share one timeout value, oldest first. Because the
 * timeout is the same, the order they are added is the order they expire, so only the
 * head can be the next to expire.
 */
class DeadlineList<T extends HasDeadline<T>> implements ListEnds<T> {
  head: DeadlineEntry<T> | undefined = undefined;
  tail: DeadlineEntry<T> | undefined = undefined;
  timer: ReturnType<typeof setTimeout> | undefined = undefined;
  /** The deadline the timer is armed for. */
  armedFor = Infinity;

  constructor(readonly timeout: number) {}

  push(entry: DeadlineEntry<T>) {
    if (this.tail === undefined) {
      this.head = entry;
    } else {
      this.tail.next = entry;
    }
    this.tail = entry;
  }

  /** Drops the dead entries at the head. */
  trim() {
    let head = this.head;
    while (head !== undefined && head.item.timerEntry !== head) head = head.next;
    this.head = head;
    if (head === undefined) this.tail = undefined;
  }

  /**
   * Inserts an entry in deadline order. Only for an item moved from another queue, whose
   * deadline is older than the ones added here; it usually lands near the head.
   */
  insert(entry: DeadlineEntry<T>) {
    entry.list = this;
    if (this.head === undefined || this.head.deadline > entry.deadline) {
      entry.next = this.head;
      this.head = entry;
      if (this.tail === undefined) this.tail = entry;
      return;
    }
    let previous = this.head;
    while (previous.next !== undefined && previous.next.deadline <= entry.deadline) {
      previous = previous.next;
    }
    entry.next = previous.next;
    previous.next = entry;
    if (entry.next === undefined) this.tail = entry;
  }
}

/**
 * The command timeouts of one queue: one list per timeout value, with one timer per list.
 *
 * - Adding a deadline costs a push. A later deadline of the same list never needs an
 *   earlier timer, so commands that arrive fast cause no timer calls.
 * - Ending a timeout is one field write. The entry stays in its list as a dead entry, and
 *   leaves when it is at the head, which is the usual case because commands are written
 *   in order.
 * - The timer is never cleared when a timeout ends. When it fires, it takes the dead and
 *   expired entries from the head and stops at the first live one that has not expired,
 *   so it never walks the items that are still waiting. A timeout never fires early.
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
   * Throws, and changes nothing, when `ms` is not an integer from 0 to 2^32 - 1.
   */
  add(item: T, ms: number, node: DoublyLinkedNode<T> | undefined) {
    if (typeof ms !== 'number') {
      throw new TypeError(`The "timeout" option must be of type number. Received ${typeof ms}`);
    } else if (!Number.isInteger(ms) || ms < 0 || ms > MAX_TIMEOUT) {
      throw new RangeError(`The value of "timeout" is out of range. It must be an integer >= 0 && <= ${MAX_TIMEOUT}. Received ${ms}`);
    }

    const list = this.#list(ms);
    list.trim();
    const entry: DeadlineEntry<T> = { item, deadline: performance.now() + ms, node, next: undefined, list };
    item.timerEntry = entry;
    list.push(entry);
    if (list.timer === undefined) this.#arm(list, entry.deadline);
  }

  /** Ends the item's timeout, if it has one. */
  static end<T extends HasDeadline<T>>(item: T) {
    const entry = item.timerEntry;
    if (entry === undefined) return;
    item.timerEntry = undefined;
    const list = entry.list;
    if (list !== undefined && list.head === entry) {
      list.head = entry.next;
      if (list.head === undefined) list.tail = undefined;
    }
  }

  /**
   * For an item that leaves its queue: gives it an entry of its own, outside the queue's
   * lists, so that queue's timer no longer sees it. The queue it moves to calls `adopt`.
   */
  static detach<T extends HasDeadline<T>>(item: T) {
    const entry = item.timerEntry;
    if (entry === undefined) return;
    item.timerEntry = { item, deadline: entry.deadline, node: undefined, next: undefined, list: undefined };
  }

  /**
   * Takes over the timeout of an item that `detach` moved out of another queue. The item
   * keeps its deadline. Returns `false`, and ends the timeout, when that deadline already
   * passed.
   */
  adopt(item: T, ms: number, node: DoublyLinkedNode<T>): boolean {
    const entry = item.timerEntry;
    if (entry === undefined) return true;
    if (entry.deadline <= performance.now()) {
      item.timerEntry = undefined;
      return false;
    }
    entry.node = node;
    entry.next = undefined;
    const list = this.#list(ms);
    list.insert(entry);
    this.#arm(list, entry.deadline);
    return true;
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
    while (entry !== undefined) {
      if (entry.item.timerEntry === entry) {
        if (entry.deadline > now) break;
        entry.item.timerEntry = undefined;
        (expired ??= []).push(entry);
      }
      entry = entry.next;
    }
    list.head = entry;
    if (entry !== undefined) {
      this.#arm(list, entry.deadline);
    } else {
      list.tail = undefined;
      if (this.#lists.get(list.timeout) === list) this.#lists.delete(list.timeout);
      if (this.#lastList === list) this.#lastList = undefined;
    }

    // Call back after the list is updated: a callback can add items.
    if (expired) {
      for (const { item, node } of expired) this.#onExpire(item, node);
    }
  };
}
