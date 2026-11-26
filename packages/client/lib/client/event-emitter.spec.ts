import { strict as assert } from 'node:assert';
import EventEmitter from 'node:events';
import { spy } from 'sinon';
import { createClient } from '../../';

describe('Client EventEmitter', () => {
  it('keeps listener state on the client that emits', () => {
    // `createClient()` wraps an inner client, and the socket emits its events
    // on that inner client. Removing the last listener used to leave the
    // wrapper and the emitter with different `_events` objects, so the removed
    // listener kept firing and the next one never did (#3680).
    const client = createClient({});
    const emitter = Object.getPrototypeOf(client) as EventEmitter;

    const removedListener = spy();
    const nextListener = spy();
    client.on('error', removedListener);
    client.removeListener('error', removedListener);
    client.on('error', nextListener);

    emitter.emit('error', new Error('connection failed'));

    assert.equal(removedListener.callCount, 0);
    assert.equal(nextListener.callCount, 1);
    assert.equal(client.listenerCount('error'), 1);
    assert.equal(client.eventNames().includes('error'), true);
  });

  it('never clears listeners of the emitting client from a derived proxy', () => {
    const client = createClient({});
    const emitter = Object.getPrototypeOf(client) as EventEmitter;
    const listener = spy();

    client.on('connect', listener);
    const derived = client.withCommandOptions({ asap: true });
    derived.removeAllListeners('connect');

    emitter.emit('connect');

    assert.equal(listener.callCount, 0);
    assert.equal(client.listenerCount('connect'), 0);
    assert.equal(emitter.listenerCount('connect'), 0);
  });
});
