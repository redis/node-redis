import assert from 'node:assert';
import RedisCommandsQueue from './commands-queue';
import { AbortError, DisconnectsClientError, TimeoutError } from '../errors';

describe('RedisCommandsQueue', () => {
  function createQueue() {
    return new RedisCommandsQueue(3, null, () => {}, 'test-client');
  }

  function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  describe('extractAllCommands', () => {
    it('returns and removes every queued command, not just the first one', () => {
      const queue = createQueue();
      for (let i = 0; i < 5; i++) {
        queue.addCommand([`CMD${i}`]).catch(() => {});
      }

      const extracted = queue.extractAllCommands();

      assert.strictEqual(extracted.length, 5);
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['CMD0', 'CMD1', 'CMD2', 'CMD3', 'CMD4'],
      );
      assert.strictEqual(queue.extractAllCommands().length, 0);
    });
  });

  describe('chainInExecution', () => {
    it('is undefined before anything is written, and matches a chain once part of it is sent', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      assert.strictEqual(queue.chainInExecution, undefined);

      queue.addCommand(['MULTI'], { chainId }).catch(() => {});
      queue.addCommand(['SET', 'k', 'v'], { chainId }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId }).catch(() => {});

      // Nothing sent yet - the whole chain is still just sitting in #toWrite.
      assert.strictEqual(queue.chainInExecution, undefined);

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" SET

      // Two of the three commands are now in #waitingForReply (out of view);
      // chainInExecution should point at this chain, and the one command
      // still in #toWrite (EXEC) should carry a matching chainId - that's
      // the tail-of-an-in-flight-chain signal cluster-slots.ts relies on.
      assert.strictEqual(queue.chainInExecution, chainId);

      const remaining = queue.extractAllCommands();
      assert.strictEqual(remaining.length, 1);
      assert.strictEqual(remaining[0].chainId, queue.chainInExecution);
    });

    it('leaves a finished chain with no queued tail to relocate', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" EXEC - whole chain is now in #waitingForReply

      // The whole chain was sent, so nothing of it remains in #toWrite -
      // extractAllCommands has nothing left to (mis)classify as its tail.
      assert.strictEqual(queue.chainInExecution, chainId);
      assert.strictEqual(queue.extractAllCommands().length, 0);
    });
  });

  describe('extractCommandsForSlots', () => {
    it('leaves the queued tail of an in-flight chain and everything after it in place', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['SET', 'k', 'v'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId, slotNumber: 1 }).catch(() => {});
      // Queued after the chain, on the same connection. If this were
      // relocated to another node while the transaction is still pending
      // here, it could run before the transaction completes - reading 'k'
      // before SET applies, even though it was queued after EXEC.
      queue.addCommand(['GET', 'k'], { slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI - SET, EXEC and GET are still queued behind it

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // Nothing is extracted: reaching the in-flight chain's tail stops the
      // scan entirely, so GET stays behind it in queue order too.
      assert.deepStrictEqual(extracted, []);
      assert.strictEqual(queue.pendingCount, 4);
    });

    it('is unaffected by an already-fully-sent chain', () => {
      const queue = createQueue();
      const chainId = Symbol('MULTI Chain');

      queue.addCommand(['MULTI'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['GET', 'k'], { slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" MULTI
      writer.next(); // "sends" EXEC - the whole chain is now in #waitingForReply

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // chainInExecution still points at this chain (nothing has been sent
      // since), but none of its commands remain in #toWrite to (mis)match -
      // the trailing GET is extracted normally.
      assert.strictEqual(queue.chainInExecution, chainId);
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['GET'],
      );
    });

    it('extracts a second, fully-queued chain atomically without mistaking it for the in-flight chain\'s tail', () => {
      const queue = createQueue();
      const chainA = Symbol('Chain A (in-flight, different slot)');
      const chainB = Symbol('Chain B (fully queued, migrating slot)');

      // Chain A is in flight on a slot that isn't migrating - its queued
      // tail (SET, EXEC) carries a chainId that will equal chainInExecution.
      queue.addCommand(['MULTI'], { chainId: chainA, slotNumber: 5 }).catch(() => {});
      queue.addCommand(['SET', 'a', '1'], { chainId: chainA, slotNumber: 5 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId: chainA, slotNumber: 5 }).catch(() => {});

      // Chain B is queued entirely behind chain A, on the slot that IS
      // migrating. None of its commands have been sent, so none of them
      // carry chainInExecution's id - it's a distinct chain, not a
      // continuation of chain A's tail.
      queue.addCommand(['MULTI'], { chainId: chainB, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['SET', 'b', '2'], { chainId: chainB, slotNumber: 1 }).catch(() => {});
      queue.addCommand(['EXEC'], { chainId: chainB, slotNumber: 1 }).catch(() => {});

      const writer = queue.commandsToWrite();
      writer.next(); // "sends" chain A's MULTI - chainInExecution now points at chain A

      const extracted = queue.extractCommandsForSlots(new Set([1]));

      // Chain B should be extracted entirely (all 3 commands), despite chain A
      // being in flight and having the same chainId in #toWrite.
      assert.deepStrictEqual(
        extracted.map(command => command.args?.[0]),
        ['MULTI', 'SET', 'EXEC'],
      );
      assert.strictEqual(queue.chainInExecution, chainA);
    });
  });

  describe('#onPush empty queue handling (fix for #3049)', () => {
    let queue: RedisCommandsQueue;

    beforeEach(() => {
      queue = new RedisCommandsQueue(3, null, () => {}, 'test-client');
    });

    // Access the private #onPush method via the decoder
    const getOnPushHandler = (q: RedisCommandsQueue) => {
      // @ts-ignore - accessing private property for testing
      return (q as any).decoder?.onPush;
    };

    it('should return undefined for message push when queue is empty (decoder.onPush returns undefined)', () => {
      const onPush = getOnPushHandler(queue);
      assert.strictEqual(typeof onPush, 'function');

      // Message push (PubSub) - this goes through handleMessageReply first
      const messagePush = [Buffer.from('message'), Buffer.from('test-channel'), Buffer.from('test-data')];

      // decoder.onPush returns undefined (does not propagate handler return value)
      const result = onPush(messagePush);
      assert.strictEqual(result, undefined);
    });

    it('should return undefined for sharded unsubscribe when queue is empty (decoder.onPush returns undefined)', () => {
      const onPush = getOnPushHandler(queue);
      assert.strictEqual(typeof onPush, 'function');

      // Sharded unsubscribe push
      const shardedUnsubscribePush = [Buffer.from('sunsubscribe'), Buffer.from('test-channel')];

      // decoder.onPush returns undefined (does not propagate handler return value)
      const result = onPush(shardedUnsubscribePush);
      assert.strictEqual(result, undefined);
    });

    it('should return undefined for status reply when queue is empty (decoder.onPush returns undefined)', () => {
      const onPush = getOnPushHandler(queue);
      assert.strictEqual(typeof onPush, 'function');

      // Status reply push (e.g., subscribe acknowledgment)
      const statusReplyPush = [Buffer.from('subscribe'), Buffer.from('test-channel'), Buffer.from('1')];

      // decoder.onPush returns undefined (does not propagate handler return value)
      const result = onPush(statusReplyPush);
      assert.strictEqual(result, undefined);
    });

    it('should return undefined when queue is not empty (decoder.onPush returns undefined)', () => {
      const onPush = getOnPushHandler(queue);
      assert.strictEqual(typeof onPush, 'function');

      // Add a command to make queue non-empty
      queue.addCommand(['PING']).catch(() => {});

      // Send the command to move it to waitingForReply
      const writer = queue.commandsToWrite();
      writer.next();

      // Status reply push
      const statusReplyPush = [Buffer.from('subscribe'), Buffer.from('test-channel'), Buffer.from('1')];

      // decoder.onPush returns undefined (does not propagate handler return value)
      const result = onPush(statusReplyPush);
      assert.strictEqual(result, undefined);
    });
  });
});