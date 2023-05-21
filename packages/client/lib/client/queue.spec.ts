import Queue from './queue';
import { equal, deepEqual } from 'assert/strict';

describe('Queue', () => {
  const queue = new Queue();

  it('should start empty', () => {
    equal(queue.length, 0);
    deepEqual(Array.from(queue), []);
  });

  it('shift empty', () => {
    equal(queue.shift(), null);
    equal(queue.length, 0);
    deepEqual(Array.from(queue), []);
  });

  it('push 1', () => {
    queue.push(1);
    equal(queue.length, 1);
    deepEqual(Array.from(queue), [1]);
  });

  it('push 2', () => {
    queue.push(2);
    equal(queue.length, 2);
    deepEqual(Array.from(queue), [1, 2]);
  });

  it('unshift 0', () => {
    queue.unshift(0);
    equal(queue.length, 3);
    deepEqual(Array.from(queue), [0, 1, 2]);
  });

  it('remove middle node', () => {
    queue.remove(queue.head.next!);
    equal(queue.length, 2);
    deepEqual(Array.from(queue), [0, 2]);
  });

  it('remove head', () => {
    queue.remove(queue.head);
    equal(queue.length, 1);
    deepEqual(Array.from(queue), [2]);
  });

  it('remove tail', () => {
    queue.remove(queue.tail);
    equal(queue.length, 0);
    deepEqual(Array.from(queue), []);
  });

  it('unshift empty queue', () => {
    queue.unshift(0);
    equal(queue.length, 1);
    deepEqual(Array.from(queue), [0]);
  });

  it('push 1', () => {
    queue.push(1);
    equal(queue.length, 2);
    deepEqual(Array.from(queue), [0, 1]);
  });

  it('shift', () => {
    equal(queue.shift(), 0);
    equal(queue.length, 1);
    deepEqual(Array.from(queue), [1]);
  });

  it('shift last element', () => {
    equal(queue.shift(), 1);
    equal(queue.length, 0);
    deepEqual(Array.from(queue), []);
  });
});
