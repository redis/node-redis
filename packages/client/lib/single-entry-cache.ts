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
export default class SingleEntryCache {
  #cached?: any;
  #key?: string;

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
  get(keyObj?: object) {
    return JSON.stringify(keyObj, makeCircularReplacer()) === this.#key ? this.#cached : undefined;
  }

  set(keyObj: object | undefined, obj: any) {
    this.#cached = obj;
    this.#key = JSON.stringify(keyObj, makeCircularReplacer());
  }
}
