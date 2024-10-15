import { strict as assert } from 'node:assert';
import CLUSTER_DELSLOTSRANGE from './CLUSTER_DELSLOTSRANGE';

describe('CLUSTER DELSLOTSRANGE', () => {
  describe('transformArguments', () => {
    it('single', () => {
      assert.deepEqual(
        CLUSTER_DELSLOTSRANGE.transformArguments({
          start: 0,
          end: 1
        }),
        ['CLUSTER', 'DELSLOTSRANGE', '0', '1']
      );
    });

    it('multiple', () => {
      assert.deepEqual(
        CLUSTER_DELSLOTSRANGE.transformArguments([{
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
