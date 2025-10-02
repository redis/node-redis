import {
  SinglyLinkedList,
  DoublyLinkedList,
  EmptyAwareSinglyLinkedList,
} from "./linked-list";
import { equal, deepEqual } from "assert/strict";

describe("DoublyLinkedList", () => {
  const list = new DoublyLinkedList<number>();

  it("should start empty", () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
    deepEqual(Array.from(list), []);
  });

  it("shift empty", () => {
    equal(list.shift(), undefined);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it("push 1", () => {
    list.push(1);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it("push 2", () => {
    list.push(2);
    equal(list.length, 2);
    deepEqual(Array.from(list), [1, 2]);
  });

  it("unshift 0", () => {
    list.unshift(0);
    equal(list.length, 3);
    deepEqual(Array.from(list), [0, 1, 2]);
  });

  it("remove middle node", () => {
    list.remove(list.head!.next!);
    equal(list.length, 2);
    deepEqual(Array.from(list), [0, 2]);
  });

  it("remove head", () => {
    list.remove(list.head!);
    equal(list.length, 1);
    deepEqual(Array.from(list), [2]);
  });

  it("remove tail", () => {
    list.remove(list.tail!);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it("unshift empty queue", () => {
    list.unshift(0);
    equal(list.length, 1);
    deepEqual(Array.from(list), [0]);
  });

  it("push 1", () => {
    list.push(1);
    equal(list.length, 2);
    deepEqual(Array.from(list), [0, 1]);
  });

  it("shift", () => {
    equal(list.shift(), 0);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it("shift last element", () => {
    equal(list.shift(), 1);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it("provide forEach for nodes", () => {
    list.reset();
    list.push(1);
    list.push(2);
    list.push(3);
    let count = 0;
    for(const _ of list.nodes()) {
      count++;
    }
    equal(count, 3);
    for(const _ of list.nodes()) {
      count++;
    }
    equal(count, 6);
  });

  it("should handle remove on empty list", () => {
    list.reset();
    const node = list.push(1);
    list.remove(node);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
    list.remove(node);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });


  it("should safely remove nodes while iterating", () => {
    list.reset();
    list.push(1);
    list.push(2);
    list.push(3);
    list.push(4);
    list.push(5);
    
    const visited: number[] = [];
    for (const node of list.nodes()) {
      visited.push(node.value);
      if (node.value % 2 === 0) {
        list.remove(node);
      }
    }
    deepEqual(visited, [1, 2, 3, 4, 5]);
    equal(list.length, 3);
    deepEqual(Array.from(list), [1, 3, 5]);
  });
});

describe("SinglyLinkedList", () => {
  const list = new SinglyLinkedList();

  it("should start empty", () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
    deepEqual(Array.from(list), []);
  });

  it("shift empty", () => {
    equal(list.shift(), undefined);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it("push 1", () => {
    list.push(1);
    equal(list.length, 1);
    deepEqual(Array.from(list), [1]);
  });

  it("push 2", () => {
    list.push(2);
    equal(list.length, 2);
    deepEqual(Array.from(list), [1, 2]);
  });

  it("push 3", () => {
    list.push(3);
    equal(list.length, 3);
    deepEqual(Array.from(list), [1, 2, 3]);
  });

  it("shift 1", () => {
    equal(list.shift(), 1);
    equal(list.length, 2);
    deepEqual(Array.from(list), [2, 3]);
  });

  it("shift 2", () => {
    equal(list.shift(), 2);
    equal(list.length, 1);
    deepEqual(Array.from(list), [3]);
  });

  it("shift 3", () => {
    equal(list.shift(), 3);
    equal(list.length, 0);
    deepEqual(Array.from(list), []);
  });

  it("should be empty", () => {
    equal(list.length, 0);
    equal(list.head, undefined);
    equal(list.tail, undefined);
  });
});

describe("EmptyAwareSinglyLinkedList", () => {
  it("should emit 'empty' event when reset", () => {
    const list = new EmptyAwareSinglyLinkedList<number>();
    let count = 0;
    list.events.on("empty", () => count++);
    list.push(1);
    list.reset();
    equal(count, 1);
    list.reset();
    equal(count, 1);
  });

  it("should emit 'empty' event when shift makes the list empty", () => {
    const list = new EmptyAwareSinglyLinkedList<number>();
    let count = 0;
    list.events.on("empty", () => count++);
    list.push(1);
    list.push(2);
    list.shift();
    equal(count, 0);
    list.shift();
    equal(count, 1);
    list.shift();
    equal(count, 1);
  });

  it("should emit 'empty' event when remove makes the list empty", () => {
    const list = new EmptyAwareSinglyLinkedList<number>();
    let count = 0;
    list.events.on("empty", () => count++);
    const node1 = list.push(1);
    const node2 = list.push(2);
    list.remove(node1, undefined);
    equal(count, 0);
    list.remove(node2, undefined);
    equal(count, 1);
  });
});
