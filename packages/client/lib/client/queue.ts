export interface QueueNode<T> {
  value: T;
  previous: QueueNode<T> | null;
  next: QueueNode<T> | null;
}

export default class Queue<T> {
  private _length = 0;

  get length() {
    return this._length;
  }

  private _head: QueueNode<T> | null = null;

  get head() {
    return this._head;
  }

  _tail: QueueNode<T> | null = null;

  get tail() {
    return this._tail;
  }

  push(value: T) {
    ++this._length;

    if (!this._tail) {
      return this._tail = this._head = {
        previous: this._head,
        next: null,
        value
      };
    } 

    return this._tail = this._tail.next = {
      previous: this._tail,
      next: null,
      value
    };
  }

  unshift(value: T) {
    ++this._length;

    if (!this._head) {
      return this._head = this._tail = {
        previous: null,
        next: null,
        value
      };
    }

    return this._head = this._head.previous = {
      previous: null,
      next: this._head,
      value
    };
  }

  shift() {
    if (!this._head) return null;

    --this._length;
    const node = this._head;
    if (node.next) {
      node.next.previous = node.previous;
      this._head = node.next;
      node.next = null;
    } else {
      this._head = this._tail = null;
    }
    return node.value;
  }

  remove(node: QueueNode<T>) {
    --this._length;

    if (this._tail === node) {
      this._tail = node.previous;
    }

    if (this._head === node) {
      this._head = node.next;
    } else {
      node.previous!.next = node.next;
      node.previous = null;
    }
    
    node.next = null;
  }

  *[Symbol.iterator]() {
    let node = this._head;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }
}
