import { SinglyLinkedList, DoublyLinkedList } from './linked-list';
import { equal, deepEqual } from 'assert/strict';

describe('DoublyLinkedList', () => {
  const list = new DoublyLinkedList();

  it('should start empty', () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
    deepEqual(Array.from(list), []);
  });

  it('shift empty', () => {
    equal(list.shift(), undefined);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it('push 1', () => {
    list.push(1);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it('push 2', () => {
    list.push(2);
    equal(list.length, 2);
    deepEqual(Array.from(list), [1, 2]);
  });

  it('unshift 0', () => {
    list.unshift(0);
    equal(list.length, 3);
    deepEqual(Array.from(list), [0, 1, 2]);
  });

  it('remove middle node', () => {
    list.remove(list.head!.next!);
    equal(list.length, 2);
    deepEqual(Array.from(list), [0, 2]);
  });

  it('remove head', () => {
    list.remove(list.head!);
    equal(list.length, 1);
    deepEqual(Array.from(list), [2]);
  });

  it('remove tail', () => {
    list.remove(list.tail!);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it('unshift empty queue', () => {
    list.unshift(0);
    equal(list.length, 1);
    deepEqual(Array.from(list), [0]);
  });

  it('push 1', () => {
    list.push(1);
    equal(list.length, 2);
    deepEqual(Array.from(list), [0, 1]);
  });

  it('shift', () => {
    equal(list.shift(), 0);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it('shift last element', () => {
    equal(list.shift(), 1);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });
});

describe('SinglyLinkedList', () => {
  const list = new SinglyLinkedList();

  it('should start empty', () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
    deepEqual(Array.from(list), []);
  });

  it('shift empty', () => {
    equal(list.shift(), undefined);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it('push 1', () => {
    list.push(1);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it('push 2', () => {
    list.push(2);
    equal(list.length, 2);
    deepEqual(Array.from(list), [1, 2]);
  });

  it('push 3', () => {
    list.push(3);
    equal(list.length, 3);
    deepEqual(Array.from(list), [1, 2, 3]);
  });

  it('shift 1', () => {
    equal(list.shift(), 1);
    equal(list.length, 2);
    deepEqual(Array.from(list), [2, 3]);
  });

  it('shift 2', () => {
    equal(list.shift(), 2);
    equal(list.length, 1);
    deepEqual(Array.from(list), [3]);
  });

  it('shift 3', () => {
    equal(list.shift(), 3);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it('should be empty', () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
  });
});
