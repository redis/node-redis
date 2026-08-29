import { strict as assert } from 'node:assert';
import { Circuit } from './circuit';

describe('Circuit', () => {
  const GRACE_PERIOD = 1000;
  const NUM_PROBES = 3;

  function createCircuit() {
    let now = 0;
    return {
      circuit: new Circuit({
        gracePeriod: GRACE_PERIOD,
        numProbes: NUM_PROBES,
        clock: () => now
      }),
      advance(ms: number) {
        now += ms;
      }
    };
  }

  it('starts CLOSED', () => {
    const { circuit } = createCircuit();
    assert.equal(circuit.state, 'CLOSED');
  });

  describe('open()', () => {
    it('trips CLOSED → OPEN and reports the transition', () => {
      const { circuit } = createCircuit();
      assert.equal(circuit.open(), true);
      assert.equal(circuit.state, 'OPEN');
    });

    it('is a no-op while already OPEN and does not extend the grace period', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      advance(GRACE_PERIOD - 1);
      assert.equal(circuit.open(), false);
      advance(1);
      assert.equal(circuit.state, 'HALF_OPEN');
    });

    it('reopens from HALF_OPEN with a fresh grace period', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      advance(GRACE_PERIOD);
      assert.equal(circuit.state, 'HALF_OPEN');
      assert.equal(circuit.open(), true);
      assert.equal(circuit.state, 'OPEN');
      advance(GRACE_PERIOD - 1);
      assert.equal(circuit.state, 'OPEN');
      advance(1);
      assert.equal(circuit.state, 'HALF_OPEN');
    });
  });

  describe('grace period', () => {
    it('stays OPEN before the grace period elapses', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      advance(GRACE_PERIOD - 1);
      assert.equal(circuit.state, 'OPEN');
    });

    it('reports HALF_OPEN once the grace period elapses', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      advance(GRACE_PERIOD);
      assert.equal(circuit.state, 'HALF_OPEN');
    });
  });

  describe('HALF_OPEN probing', () => {
    function createHalfOpenCircuit() {
      const created = createCircuit();
      created.circuit.open();
      created.advance(GRACE_PERIOD);
      return created;
    }

    it('closes after numProbes consecutive successful probes', () => {
      const { circuit } = createHalfOpenCircuit();
      assert.equal(circuit.probeSucceeded(), false);
      assert.equal(circuit.probeSucceeded(), false);
      assert.equal(circuit.probeSucceeded(), true);
      assert.equal(circuit.state, 'CLOSED');
    });

    it('stays HALF_OPEN below numProbes successes', () => {
      const { circuit } = createHalfOpenCircuit();
      circuit.probeSucceeded();
      circuit.probeSucceeded();
      assert.equal(circuit.state, 'HALF_OPEN');
    });

    it('probe failure reopens and restarts the grace period', () => {
      const { circuit, advance } = createHalfOpenCircuit();
      assert.equal(circuit.probeFailed(), true);
      assert.equal(circuit.state, 'OPEN');
      advance(GRACE_PERIOD - 1);
      assert.equal(circuit.state, 'OPEN');
      advance(1);
      assert.equal(circuit.state, 'HALF_OPEN');
    });

    it('probe failure resets the consecutive success count', () => {
      const { circuit, advance } = createHalfOpenCircuit();
      circuit.probeSucceeded();
      circuit.probeSucceeded();
      circuit.probeFailed();
      advance(GRACE_PERIOD);
      assert.equal(circuit.state, 'HALF_OPEN');
      circuit.probeSucceeded();
      circuit.probeSucceeded();
      assert.equal(circuit.state, 'HALF_OPEN');
      assert.equal(circuit.probeSucceeded(), true);
      assert.equal(circuit.state, 'CLOSED');
    });
  });

  describe('probes outside HALF_OPEN', () => {
    it('probeSucceeded is a no-op while CLOSED', () => {
      const { circuit } = createCircuit();
      assert.equal(circuit.probeSucceeded(), false);
      assert.equal(circuit.state, 'CLOSED');
    });

    it('probeSucceeded is ignored while OPEN with the grace period pending', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      circuit.probeSucceeded();
      circuit.probeSucceeded();
      advance(GRACE_PERIOD);
      // pre-grace successes must not count toward the HALF_OPEN threshold
      assert.equal(circuit.probeSucceeded(), false);
      assert.equal(circuit.probeSucceeded(), false);
      assert.equal(circuit.probeSucceeded(), true);
      assert.equal(circuit.state, 'CLOSED');
    });
  });

  describe('close()', () => {
    it('forces CLOSED from OPEN', () => {
      const { circuit } = createCircuit();
      circuit.open();
      assert.equal(circuit.close(), true);
      assert.equal(circuit.state, 'CLOSED');
    });

    it('forces CLOSED from HALF_OPEN', () => {
      const { circuit, advance } = createCircuit();
      circuit.open();
      advance(GRACE_PERIOD);
      assert.equal(circuit.close(), true);
      assert.equal(circuit.state, 'CLOSED');
    });

    it('reports no transition when already CLOSED', () => {
      const { circuit } = createCircuit();
      assert.equal(circuit.close(), false);
    });
  });
});
