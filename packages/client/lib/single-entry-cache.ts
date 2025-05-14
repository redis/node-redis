export default class SingleEntryCache<K, V> {
  #cached?: V;
  #serializedKey?: string;

  /**
   * Retrieves an instance from the cache based on the provided key object.
   *
   * @param keyObj - The key object to look up in the cache.
   * @returns The cached instance if found, undefined otherwise.
   *
   * @remarks
   * This method uses JSON.stringify for comparison, which may not work correctly
   * if the properties in the key object are rearranged or reordered.
   */
  get(keyObj?: K): V | undefined {
    return JSON.stringify(keyObj, makeCircularReplacer()) === this.#serializedKey ? this.#cached : undefined;
  }

  set(keyObj:  K | undefined, obj: V) {
    this.#cached = obj;
    this.#serializedKey = JSON.stringify(keyObj, makeCircularReplacer());
  }
}

function makeCircularReplacer() {
  const seen = new WeakSet();
  return function serialize(_: string, value: any) {
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return 'circular';
      }
      seen.add(value);
      return value;
    }
    return value;
  }
}