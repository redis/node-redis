import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { NodeAddressMap } from './types';

describe('NodeAddressMap', () => {
  describe('type checking', () => {
    it('should accept object mapping', () => {
      const map: NodeAddressMap = {
        '10.0.0.1:6379': {
          host: 'external-host.io',
          port: 6379
        }
      };
      
      assert.ok(map);
    });

    it('should accept function mapping', () => {
      const map: NodeAddressMap = (address: string) => {
        const [host, port] = address.split(':');
        return {
          host: `external-${host}.io`,
          port: Number(port)
        };
      };
      
      assert.ok(map);
    });
  });

  describe('object mapping', () => {
    it('should map addresses correctly', () => {
      const map: NodeAddressMap = {
        '10.0.0.1:6379': {
          host: 'external-host.io',
          port: 6379
        },
        '10.0.0.2:6379': {
          host: 'external-host.io',
          port: 6380
        }
      };

      assert.deepEqual(map['10.0.0.1:6379'], {
        host: 'external-host.io',
        port: 6379
      });

      assert.deepEqual(map['10.0.0.2:6379'], {
        host: 'external-host.io',
        port: 6380
      });
    });
  });

  describe('function mapping', () => {
    it('should map addresses dynamically', () => {
      const map: NodeAddressMap = (address: string) => {
        const [host, port] = address.split(':');
        return {
          host: `external-${host}.io`,
          port: Number(port)
        };
      };

      const result1 = map('10.0.0.1:6379');
      assert.deepEqual(result1, {
        host: 'external-10.0.0.1.io',
        port: 6379
      });

      const result2 = map('10.0.0.2:6380');
      assert.deepEqual(result2, {
        host: 'external-10.0.0.2.io',
        port: 6380
      });
    });

    it('should return undefined for unmapped addresses', () => {
      const map: NodeAddressMap = (address: string) => {
        if (address.startsWith('10.0.0.')) {
          const [host, port] = address.split(':');
          return {
            host: `external-${host}.io`,
            port: Number(port)
          };
        }
        return undefined;
      };

      const result = map('192.168.1.1:6379');
      assert.equal(result, undefined);
    });
  });
});

