import { strict as assert } from 'node:assert';
import CLUSTER_DELSLOTSRANGE from './CLUSTER_DELSLOTSRANGE';
import { parseArgs } from './generic-transformers';

describe('CLUSTER DELSLOTSRANGE', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_DELSLOTSRANGE, {
          start: 0,
          end: 1
        }),
        ['CLUSTER', 'DELSLOTSRANGE', '0', '1']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        parseArgs(CLUSTER_DELSLOTSRANGE, [{
          start: 0,
          end: 1
        }, {
          start: 2,
          end: 3
        }]),
        ['CLUSTER', 'DELSLOTSRANGE', '0', '1', '2', '3']
      );
    });
  });
});
