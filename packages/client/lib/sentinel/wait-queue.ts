import { SinglyLinkedList } from '../client/linked-list';

export class WaitQueue<T> {
  #list = new SinglyLinkedList<T>();
  #queue = new SinglyLinkedList<(item: T) => unknown>();

  push(value: T) {
    const resolve = this.#queue.shift();
    if (resolve !== undefined) {
      resolve(value);
      return;
    }

    this.#list.push(value);
  }

  shift() {
    return this.#list.shift();
  }

  wait() {
    return new Promise<T>(resolve => this.#queue.push(resolve));
  }
}
