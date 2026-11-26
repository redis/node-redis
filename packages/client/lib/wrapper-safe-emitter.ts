import { EventEmitter } from 'node:events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same as EventEmitter's listener type
type Listener = (...args: Array<any>) => void;

const emitter = EventEmitter.prototype;

/**
 * An `EventEmitter` that keeps working behind `Object.create(instance)` wrappers.
 *
 * `EventEmitter` keeps its state on `this` and assigns to it (a new `_events`
 * object when the last listener is removed, `_eventsCount`, `_maxListeners`).
 * Called through a wrapper, those assignments land on the wrapper: the instance
 * keeps the removed listener, and later listeners go to an object nothing emits
 * on. Every method here runs on the instance instead. Chainable methods return
 * the object they were called on.
 *
 * The methods call `EventEmitter.prototype` directly: on the instance itself a
 * plain `this._emitter.on(...)` would call this override again.
 */
export class WrapperSafeEmitter extends EventEmitter {
  private readonly _emitter: EventEmitter = this;

  override on(eventName: string | symbol, listener: Listener): this {
    emitter.on.call(this._emitter, eventName, listener);
    return this;
  }

  override addListener(eventName: string | symbol, listener: Listener): this {
    emitter.addListener.call(this._emitter, eventName, listener);
    return this;
  }

  override once(eventName: string | symbol, listener: Listener): this {
    emitter.once.call(this._emitter, eventName, listener);
    return this;
  }

  override prependListener(eventName: string | symbol, listener: Listener): this {
    emitter.prependListener.call(this._emitter, eventName, listener);
    return this;
  }

  override prependOnceListener(eventName: string | symbol, listener: Listener): this {
    emitter.prependOnceListener.call(this._emitter, eventName, listener);
    return this;
  }

  override off(eventName: string | symbol, listener: Listener): this {
    emitter.off.call(this._emitter, eventName, listener);
    return this;
  }

  override removeListener(eventName: string | symbol, listener: Listener): this {
    emitter.removeListener.call(this._emitter, eventName, listener);
    return this;
  }

  // Node branches on `arguments.length`, so the arguments pass through as given:
  // an explicit `undefined` event name must not turn into "remove everything".
  override removeAllListeners(...args: [eventName?: string | symbol]): this {
    emitter.removeAllListeners.apply(this._emitter, args);
    return this;
  }

  override setMaxListeners(n: number): this {
    emitter.setMaxListeners.call(this._emitter, n);
    return this;
  }

  override getMaxListeners(): number {
    return emitter.getMaxListeners.call(this._emitter);
  }

  override emit(eventName: string | symbol, ...args: Parameters<Listener>): boolean {
    return emitter.emit.call(this._emitter, eventName, ...args);
  }

  override listenerCount(...args: [eventName: string | symbol, listener?: Listener]): number {
    return emitter.listenerCount.apply(this._emitter, args);
  }

  override listeners(eventName: string | symbol): ReturnType<EventEmitter['listeners']> {
    return emitter.listeners.call(this._emitter, eventName);
  }

  override rawListeners(eventName: string | symbol): ReturnType<EventEmitter['rawListeners']> {
    return emitter.rawListeners.call(this._emitter, eventName);
  }

  override eventNames(): Array<string | symbol> {
    return emitter.eventNames.call(this._emitter);
  }
}
