export interface DoublyLinkedNode<T> {
  value: T;
  previous: DoublyLinkedNode<T> | undefined;
  next: DoublyLinkedNode<T> | undefined;
}

export class DoublyLinkedList<T> {
  private _length = 0;

  get length() {
    return this._length;
  }

  private _head?: DoublyLinkedNode<T>;

  get head() {
    return this._head;
  }

  private _tail?: DoublyLinkedNode<T>;

  get tail() {
    return this._tail;
  }

  push(value: T) {
    ++this._length;

    if (this._tail === undefined) {
      return this._tail = this._head = {
        previous: this._head,
        next: undefined,
        value
      };
    } 

    return this._tail = this._tail.next = {
      previous: this._tail,
      next: undefined,
      value
    };
  }

  unshift(value: T) {
    ++this._length;

    if (this._head === undefined) {
      return this._head = this._tail = {
        previous: undefined,
        next: undefined,
        value
      };
    }

    return this._head = this._head.previous = {
      previous: undefined,
      next: this._head,
      value
    };
  }

  add(value: T, prepend = false) {
    return prepend ?
      this.unshift(value) :
      this.push(value);
  }

  shift() {
    if (this._head === undefined) return undefined;

    --this._length;
    const node = this._head;
    if (node.next) {
      node.next.previous = node.previous;
      this._head = node.next;
      node.next = undefined;
    } else {
      this._head = this._tail = undefined;
    }
    return node.value;
  }

  remove(node: DoublyLinkedNode<T>) {
    --this._length;

    if (this._tail === node) {
      this._tail = node.previous;
    }

    if (this._head === node) {
      this._head = node.next;
    } else {
      node.previous!.next = node.next;
      node.previous = undefined;
    }
    
    node.next = undefined;
  }

  reset() {
    this._length = 0;
    this._head = this._tail = undefined;
  }

  *[Symbol.iterator]() {
    let node = this._head;
    while (node !== undefined) {
      yield node.value;
      node = node.next;
    }
  }
}

export interface SinglyLinkedNode<T> {
  value: T;
  next: SinglyLinkedNode<T> | undefined;
}

export class SinglyLinkedList<T> {
  private _length = 0;

  get length() {
    return this._length;
  }

  private _head?: SinglyLinkedNode<T>;

  get head() {
    return this._head;
  }

  private _tail?: SinglyLinkedNode<T>;

  get tail() {
    return this._tail;
  }

  push(value: T) {
    ++this._length;

    const node = {
      value,
      next: undefined
    };

    if (this._head === undefined) {
      return this._head = this._tail = node;
    }

    return this._tail!.next = this._tail = node;
  }

  remove(node: SinglyLinkedNode<T>, parent: SinglyLinkedNode<T> | undefined) {
    --this._length;

    if (this._head === node) {
      if (this._tail === node) {
        this._head = this._tail = undefined;
      } else {
        this._head = node.next;
      }
    } else if (this._tail === node) {
      this._tail = parent;
      parent!.next = undefined;
    } else {
      parent!.next = node.next;
    }
  }

  shift() {
    if (this._head === undefined) return undefined;

    const node = this._head;
    if (--this._length === 0) {
      this._head = this._tail = undefined;
    } else {
      this._head = node.next;
    }

    return node.value;
  }

  reset() {
    this._length = 0;
    this._head = this._tail = undefined;
  }

  *[Symbol.iterator]() {
    let node = this._head;
    while (node !== undefined) {
      yield node.value;
      node = node.next;
    }
  }
}
