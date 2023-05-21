export interface QueueNode<T> {
  value: T;
  previous: QueueNode<T> | null;
  next: QueueNode<T> | null;
}

export default class Queue<T> {
  #length = 0;

  get length() {
    return this.#length;
  }

  #head: QueueNode<T> | null = null;

  get head() {
    return this.#head;
  }

  #tail: QueueNode<T> | null = null;

  get tail() {
    return this.#tail;
  }

  push(value: T) {
    ++this.#length;

    if (!this.#tail) {
      return this.#tail = this.#head = {
        previous: this.#head,
        next: null,
        value
      };
    } 

    return this.#tail = this.#tail.next = {
      previous: this.#tail,
      next: null,
      value
    };
  }

  unshift(value: T) {
    ++this.#length;

    if (!this.#head) {
      return this.#head = this.#tail = {
        previous: null,
        next: null,
        value
      };
    }

    return this.#head = this.#head.previous = {
      previous: null,
      next: this.#head,
      value
    };
  }

  shift() {
    if (!this.#head) return null;

    --this.#length;
    const node = this.#head;
    if (node.next) {
      node.next.previous = node.previous;
      this.#head = node.next;
      node.next = null;
    } else {
      this.#head = this.#tail = null;
    }
    return node.value;
  }

  remove(node: QueueNode<T>) {
    --this.#length;

    if (this.#tail === node) {
      this.#tail = node.previous;
    }

    if (this.#head === node) {
      this.#head = node.next;
    } else {
      node.previous!.next = node.next;
      node.previous = null;
    }
    
    node.next = null;
  }

  *[Symbol.iterator]() {
    let node = this.#head;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }
}
