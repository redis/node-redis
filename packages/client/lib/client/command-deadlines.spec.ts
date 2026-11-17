import assert from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
import { CommandDeadlines, DeadlineEntry } from './command-deadlines';
import { DoublyLinkedList } from './linked-list';

interface Item {
  name: string;
  timerEntry: DeadlineEntry<Item> | undefined;
}

describe('CommandDeadlines', () => {
  function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function item(name: string): Item {
    return { name, timerEntry: undefined };
  }

  function setup() {
    const expired: Array<{ name: string, at: number, deadline: number }> = [];
    const deadlines: CommandDeadlines<Item> = new CommandDeadlines<Item>(value => {
      expired.push({ name: value.name, at: performance.now(), deadline: deadlineOf.get(value)! });
    });
    // The deadline each item had when it was added, to check that nothing fires early.
    const deadlineOf = new Map<Item, number>();
    const add = (value: Item, ms: number) => {
      deadlines.add(value, ms, undefined);
      deadlineOf.set(value, value.timerEntry!.deadline);
      return value;
    };
    return { deadlines, expired, add, names: () => expired.map(({ name }) => name) };
  }

  it('fires each item once its deadline passed, never early', async () => {
    const { add, expired, names } = setup();
    add(item('a'), 10);
    add(item('b'), 10);

    await wait(30);
    assert.deepStrictEqual(names(), ['a', 'b']);
    for (const { at, deadline } of expired) assert.ok(at >= deadline);
  });

  it('fires items with different timeouts in deadline order', async () => {
    const { add, names } = setup();
    add(item('long'), 60);
    add(item('short'), 10);
    add(item('long2'), 60);
    add(item('short2'), 10);

    await wait(30);
    assert.deepStrictEqual(names(), ['short', 'short2']);
    await wait(60);
    assert.deepStrictEqual(names(), ['short', 'short2', 'long', 'long2']);
  });

  it('ends the timeout of an item at the head and behind it', async () => {
    const { add, names } = setup();
    const a = add(item('a'), 20), b = add(item('b'), 20), c = add(item('c'), 20);
    CommandDeadlines.end(a);
    CommandDeadlines.end(c);

    await wait(40);
    assert.deepStrictEqual(names(), ['b']);
    assert.strictEqual(a.timerEntry, undefined);
    assert.strictEqual(b.timerEntry, undefined);
  });

  it('unlinks an entry at once when its timeout ends, is replaced, or moves away', () => {
    const { deadlines, add } = setup();
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(name => add(item(name), 20));
    const [entryA, entryB, entryC, entryD] = [a, b, c, d].map(value => value.timerEntry!);

    CommandDeadlines.end(b);
    assert.strictEqual(entryA.next, entryC);
    assert.strictEqual(entryC.previous, entryA);
    assert.strictEqual(entryB.list, undefined);

    add(c, 20);
    assert.strictEqual(entryC.list, undefined);
    assert.strictEqual(entryA.next, entryD);

    CommandDeadlines.detach(d);
    assert.strictEqual(d.timerEntry, entryD);
    assert.strictEqual(entryD.list, undefined);
    assert.strictEqual(entryA.next, c.timerEntry);

    CommandDeadlines.end(a);
    CommandDeadlines.end(c);
    assert.strictEqual(entryA.list, undefined);
    assert.strictEqual(c.timerEntry, undefined);
    deadlines.clear();
  });

  it('ignores `end` on an item without a timeout', () => {
    CommandDeadlines.end(item('a'));
  });

  it('replaces the earlier deadline of an item that is added again', async () => {
    const { add, names } = setup();
    const a = add(item('a'), 20);
    await wait(10);
    add(a, 20);

    await wait(15);
    assert.deepStrictEqual(names(), []);
    await wait(25);
    assert.deepStrictEqual(names(), ['a']);
  });

  it('fires an item added after every deadline passed', async () => {
    const { add, names } = setup();
    add(item('a'), 10);
    await wait(30);
    add(item('b'), 10);
    await wait(30);
    assert.deepStrictEqual(names(), ['a', 'b']);
  });

  it('accepts items added from the callback', async () => {
    const later = item('later');
    const fired: string[] = [];
    const deadlines: CommandDeadlines<Item> = new CommandDeadlines<Item>(value => {
      fired.push(value.name);
      if (value !== later) deadlines.add(later, 10, undefined);
    });
    deadlines.add(item('a'), 10, undefined);

    await wait(50);
    assert.deepStrictEqual(fired, ['a', 'later']);
  });

  it('passes the node given with the deadline', async () => {
    const list = new DoublyLinkedList<Item>();
    const a = item('a');
    const node = list.push(a);
    let got: unknown;
    const deadlines = new CommandDeadlines<Item>((_, n) => { got = n; });
    deadlines.add(a, 10, node);

    await wait(30);
    assert.strictEqual(got, node);
  });

  it('moves a deadline to another instance, which fires it at the original time', async () => {
    const source = setup(), destination = setup();
    const a = source.add(item('a'), 40);
    await wait(20);
    destination.add(item('b'), 40);

    CommandDeadlines.detach(a);
    const node = new DoublyLinkedList<Item>().push(a);
    assert.deepStrictEqual(destination.deadlines.adoptAll([{ item: a, ms: 40, node }]), []);

    await wait(30);
    assert.deepStrictEqual(source.names(), []);
    assert.deepStrictEqual(destination.names(), ['a']);
    await wait(30);
    assert.deepStrictEqual(destination.names(), ['a', 'b']);
  });

  it('refuses to adopt a deadline that already passed', async () => {
    const source = setup(), destination = setup();
    const a = source.add(item('a'), 10);
    CommandDeadlines.detach(a);
    await wait(20);

    const move = { item: a, ms: 10, node: new DoublyLinkedList<Item>().push(a) };
    assert.deepStrictEqual(destination.deadlines.adoptAll([move]), [move]);
    assert.strictEqual(a.timerEntry, undefined);
    await wait(20);
    assert.deepStrictEqual(source.names(), []);
    assert.deepStrictEqual(destination.names(), []);
  });

  it('merges moved deadlines into a list in one walk', () => {
    const source = setup(), destination = setup();
    const M = 200, N = 200;
    // Count the reads of the older deadlines: a walk from the head per moved item reads M x N.
    let reads = 0;
    const older = Array.from({ length: M }, (_, i) => {
      const entry = destination.add(item(`d${i}`), 1000).timerEntry!;
      const { deadline } = entry;
      Object.defineProperty(entry, 'deadline', { get: () => (reads++, deadline) });
      return entry;
    });
    const moved = Array.from({ length: N }, (_, i) => source.add(item(`s${i}`), 1000));
    moved.forEach(value => CommandDeadlines.detach(value));

    const list = new DoublyLinkedList<Item>();
    assert.deepStrictEqual(destination.deadlines.adoptAll(moved.map(value => ({ item: value, ms: 1000, node: list.push(value) }))), []);
    assert.ok(reads <= M + N, `read ${reads} deadlines`);

    const names: string[] = [];
    for (let entry: DeadlineEntry<Item> | undefined = older[0]; entry !== undefined; entry = entry.next) {
      names.push(entry.item.name);
    }
    assert.deepStrictEqual(names, [...older.map(entry => entry.item.name), ...moved.map(value => value.name)]);
    source.deadlines.clear();
    destination.deadlines.clear();
  });

  it('adopts an item without a timeout', () => {
    const { deadlines } = setup();
    const a = item('a');
    assert.deepStrictEqual(deadlines.adoptAll([{ item: a, ms: 10, node: new DoublyLinkedList<Item>().push(a) }]), []);
    assert.strictEqual(a.timerEntry, undefined);
  });

  it('stops every timer on `clear`', async () => {
    const { deadlines, add, names } = setup();
    add(item('a'), 10);
    add(item('b'), 30);
    deadlines.clear();

    await wait(50);
    assert.deepStrictEqual(names(), []);
  });

  it('throws the error `AbortSignal.timeout` throws for an invalid timeout, and keeps the item unchanged', () => {
    const { deadlines } = setup();
    const a = item('a');
    for (const ms of [-1, 1.5, 2 ** 32, Infinity, '10', 10n, true, {}]) {
      let expected: (Error & { code?: string }) | undefined;
      try {
        AbortSignal.timeout(ms as never);
      } catch (err) {
        expected = err as Error;
      }
      assert.ok(expected, `AbortSignal.timeout accepted ${String(ms)}`);
      assert.throws(
        () => deadlines.add(a, ms as never, undefined),
        (err: Error & { code?: string }) =>
          err.constructor === expected!.constructor && err.code === expected!.code && err.message === expected!.message
      );
    }
    assert.strictEqual(a.timerEntry, undefined);
  });

  it('runs the callback outside the async context of the caller that armed the timer', async () => {
    const storage = new AsyncLocalStorage<string>();
    const seen: Array<string | undefined> = [];
    const deadlines = new CommandDeadlines<Item>(() => seen.push(storage.getStore()));
    // `a` arms the timer inside the caller's context. `b` shares the list, so the
    // handler arms the next timer for it from inside the first one.
    storage.run('caller', () => deadlines.add(item('a'), 10, undefined));
    await wait(5);
    deadlines.add(item('b'), 10, undefined);

    await wait(40);
    assert.deepStrictEqual(seen, [undefined, undefined]);
  });

  it('keeps a timeout longer than the longest `setTimeout` delay', () => {
    const { deadlines } = setup();
    const a = item('a');
    deadlines.add(a, 2 ** 32 - 1, undefined);
    assert.ok(a.timerEntry!.deadline > performance.now() + 2 ** 31);
    deadlines.clear();
  });
});
