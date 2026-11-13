import assert from 'node:assert';
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
    assert.strictEqual(destination.deadlines.adopt(a, 40, node), true);

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

    const node = new DoublyLinkedList<Item>().push(a);
    assert.strictEqual(destination.deadlines.adopt(a, 10, node), false);
    assert.strictEqual(a.timerEntry, undefined);
    await wait(20);
    assert.deepStrictEqual(source.names(), []);
    assert.deepStrictEqual(destination.names(), []);
  });

  it('adopts an item without a timeout', () => {
    const { deadlines } = setup();
    const a = item('a');
    assert.strictEqual(deadlines.adopt(a, 10, new DoublyLinkedList<Item>().push(a)), true);
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

  it('rejects a timeout that `AbortSignal.timeout` rejected, and keeps the item unchanged', () => {
    const { deadlines } = setup();
    const a = item('a');
    assert.throws(() => deadlines.add(a, -1, undefined), RangeError);
    assert.throws(() => deadlines.add(a, 1.5, undefined), RangeError);
    assert.throws(() => deadlines.add(a, 2 ** 32, undefined), RangeError);
    assert.throws(() => deadlines.add(a, '10' as never, undefined), TypeError);
    assert.strictEqual(a.timerEntry, undefined);
  });

  it('keeps a timeout longer than the longest `setTimeout` delay', () => {
    const { deadlines } = setup();
    const a = item('a');
    deadlines.add(a, 2 ** 32 - 1, undefined);
    assert.ok(a.timerEntry!.deadline > performance.now() + 2 ** 31);
    deadlines.clear();
  });
});
