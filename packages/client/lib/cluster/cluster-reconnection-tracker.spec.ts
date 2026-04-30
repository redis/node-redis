import { strict as assert } from "node:assert";
import ClusterReconnectionTracker from "./cluster-reconnection-tracker";

describe("ClusterReconnectionTracker", () => {
  describe("validation", () => {
    for (const strategy of [-1, 1.5, Number.NaN, true, null, "1000", {}]) {
      it(`should throw when strategy is ${strategy}`, () => {
        assert.throws(
          () => new ClusterReconnectionTracker(strategy as never),
          new TypeError(
            "topologyRefreshOnReconnectionAttempt must be undefined, false, a non-negative integer, or a function",
          ),
        );
      });
    }

    it("should allow the default, false, 0, positive integer, and function strategies", () => {
      assert.doesNotThrow(() => new ClusterReconnectionTracker());
      assert.doesNotThrow(() => new ClusterReconnectionTracker(false));
      assert.doesNotThrow(() => new ClusterReconnectionTracker(0));
      assert.doesNotThrow(() => new ClusterReconnectionTracker(1));
      assert.doesNotThrow(
        () => new ClusterReconnectionTracker(() => undefined),
      );
    });
  });

  it("should not track anything when disabled", () => {
    for (const strategy of [false, 0] as const) {
      const state = new ClusterReconnectionTracker(strategy);

      assert.equal(
        state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
        false,
      );
      assert.deepEqual([...state.reconnectingAddresses], []);
      assert.equal(state.firstReconnectionAt, undefined);
    }
  });

  it("should default to refreshing after five seconds", () => {
    const state = new ClusterReconnectionTracker();

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      false,
    );
    assert.equal(state.firstReconnectionAt, 100);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 5_099),
      false,
    );
    assert.equal(state.firstReconnectionAt, 100);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 5_100),
      true,
    );
    assert.equal(state.firstReconnectionAt, 5_100);
  });

  it("should track reconnecting clients by client id and remove them independently", () => {
    const state = new ClusterReconnectionTracker(() => undefined);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      false,
    );
    assert.deepEqual([...state.reconnectingAddresses], ["127.0.0.1:1"]);
    assert.equal(state.firstReconnectionAt, 100);

    assert.equal(
      state.onReconnectionAttempt("client-2", "127.0.0.1:2", 150),
      false,
    );
    assert.deepEqual([...state.reconnectingAddresses].sort(), [
      "127.0.0.1:1",
      "127.0.0.1:2",
    ]);
    assert.equal(state.firstReconnectionAt, 100);

    state.removeClient("client-1");
    assert.deepEqual([...state.reconnectingAddresses], ["127.0.0.1:2"]);
    assert.equal(state.firstReconnectionAt, 100);

    state.removeClient("client-2");
    assert.deepEqual([...state.reconnectingAddresses], []);
    assert.equal(state.firstReconnectionAt, undefined);
  });

  it("should clear all reconnecting state", () => {
    const state = new ClusterReconnectionTracker(() => undefined);

    state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100);
    state.onReconnectionAttempt("client-2", "127.0.0.1:2", 150);
    state.clear();

    assert.deepEqual([...state.reconnectingAddresses], []);
    assert.equal(state.firstReconnectionAt, undefined);
  });

  it("should return true when enough time has elapsed and reset the timestamp", () => {
    const state = new ClusterReconnectionTracker(50);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      false,
    );
    assert.equal(state.firstReconnectionAt, 100);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 149),
      false,
    );
    assert.equal(state.firstReconnectionAt, 100);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 150),
      true,
    );
    assert.equal(state.firstReconnectionAt, 150);
  });

  it("should skip refresh when the function strategy returns false", () => {
    const state = new ClusterReconnectionTracker(() => false);

    assert.equal(
      state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      false,
    );
    assert.deepEqual([...state.reconnectingAddresses], ["127.0.0.1:1"]);
    assert.equal(state.firstReconnectionAt, 100);
  });

  it("should throw when the function strategy throws", () => {
    const error = new Error("strategy failed");
    const state = new ClusterReconnectionTracker(() => {
      throw error;
    });

    assert.throws(
      () => state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      error,
    );
  });

  it("should throw when the function strategy returns an invalid value", () => {
    const state = new ClusterReconnectionTracker(() => -1);

    assert.throws(
      () => state.onReconnectionAttempt("client-1", "127.0.0.1:1", 100),
      /topologyRefreshOnReconnectionAttempt should return/,
    );
  });
});
